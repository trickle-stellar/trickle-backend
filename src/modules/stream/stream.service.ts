import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as StellarSdk from '@stellar/stellar-sdk';
import { StellarService } from '../stellar/stellar.service';
import { FactoryService } from '../factory/factory.service';
import { addressToScVal } from '../../common/soroban/scval';
import { Stream } from './entities/stream.entity';

/** StreamStatus enum discriminants -> DB varchar values. */
const STATUS_BY_DISCRIMINANT: Record<number, string> = {
  0: 'active',
  1: 'paused',
  2: 'cancelled',
  3: 'completed',
};

export interface SubmitOutcome {
  status: 'confirmed';
  hash: string;
  /** Set when the submitted tx created a new stream (create_stream). */
  streamAddress?: string;
  /** Contract return value decoded to a native type (e.g. withdrawn amount). */
  value?: unknown;
}

/**
 * StreamService handles all business logic for payment streams.
 *
 * Two types of operations:
 * 1. **Cached reads** — stream info, sender/recipient lookups
 *    → served from Postgres (fast, indexed), with an on-chain fallback for
 *      streams that have never been indexed.
 * 2. **Real-time reads** — claimable balance
 *    → always queried directly from the Soroban contract via RPC
 *    → NEVER cached, since the value changes every second.
 *
 * State-changing operations prepare server-side XDR for the client to sign
 * with Freighter; the signed XDR comes back to POST /streams/submit.
 */
@Injectable()
export class StreamService {
  private readonly logger = new Logger(StreamService.name);

  constructor(
    @InjectRepository(Stream)
    private streamRepository: Repository<Stream>,
    private readonly stellarService: StellarService,
    private readonly factoryService: FactoryService,
  ) {}

  /**
   * Get stream info — local DB first (fast, synced by submissions), then an
   * on-chain `get_info()` fallback for streams not present in Postgres.
   */
  async getStreamInfo(contractAddress: string): Promise<Stream> {
    const cached = await this.streamRepository.findOne({
      where: { contractAddress },
    });
    if (cached) return cached;

    const result = await this.stellarService.simulateContractCall(
      contractAddress,
      'get_info',
      [],
    );
    if (result.status === 'rejected') {
      throw new NotFoundException({
        message: result.message,
        code: result.code,
      });
    }
    return this.streamFromInfo(contractAddress, result.native);
  }

  /**
   * Get the current claimable balance — ALWAYS from the contract.
   *
   * This is the ONE query that must never be cached: the claimable amount
   * changes every second as tokens stream, so we read `get_balance()` via
   * Soroban RPC simulation.
   */
  async getClaimableBalance(
    contractAddress: string,
  ): Promise<{ claimable: string }> {
    const result = await this.stellarService.simulateContractCall(
      contractAddress,
      'get_balance',
      [],
    );
    if (result.status === 'rejected') {
      throw new NotFoundException({
        message: result.message,
        code: result.code,
      });
    }
    return { claimable: String(result.native) };
  }

  /** Get all streams created by a given sender. */
  async getStreamsBySender(sender: string): Promise<Stream[]> {
    return this.streamRepository.find({
      where: { sender },
      order: { createdAt: 'DESC' },
    });
  }

  /** Get all streams where a given address is the recipient. */
  async getStreamsByRecipient(recipient: string): Promise<Stream[]> {
    return this.streamRepository.find({
      where: { recipient },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Create a new stream via the factory contract.
   *
   * Delegates to FactoryService, which validates inputs, checks the factory
   * is configured, and prepares the `create_stream` invocation as an XDR the
   * client signs with Freighter.
   */
  async createStream(
    sender: string,
    recipient: string,
    asset: string,
    amount: string,
    duration: number,
  ): Promise<{ txXdr: string; factoryAddress: string }> {
    return this.factoryService.createStream(
      sender,
      recipient,
      asset,
      amount,
      duration,
    );
  }

  /**
   * Submit a client-signed transaction and persist on-chain truth.
   *
   * When the transaction is a successful `create_stream`, its return value
   * is the deployed stream contract address — this service reads the
   * contract's `get_info()` to fill an accurate Stream row (never trusting
   * client-supplied approximations).
   */
  async submit(signedXdr: string): Promise<SubmitOutcome> {
    const outcome = await this.stellarService.submitTransaction(signedXdr);

    if (outcome.status === 'rejected') {
      throw new BadRequestException({
        message: outcome.message,
        code: outcome.code,
      });
    }

    const native = outcome.returnValue
      ? StellarSdk.scValToNative(outcome.returnValue)
      : undefined;

    // create_stream returns the deployed stream's contract address.
    if (typeof native === 'string' && native.startsWith('C')) {
      const info = await this.stellarService.simulateContractCall(
        native,
        'get_info',
        [],
      );
      if (info.status === 'succeeded') {
        await this.streamRepository.upsert(this.streamFromInfo(native, info.native), {
          conflictPaths: ['contractAddress'],
        });
      }
      return { status: 'confirmed', hash: outcome.hash, streamAddress: native };
    }

    return { status: 'confirmed', hash: outcome.hash, value: native };
  }

  /** Prepare a `withdraw(recipient)` invocation; the recipient signs. */
  async withdraw(
    contractAddress: string,
    recipient: string,
  ): Promise<{ txXdr: string }> {
    return this.prepareStateChange(recipient, contractAddress, 'withdraw', recipient);
  }

  /** Prepare a `pause(sender)` invocation; the sender signs. */
  async pause(
    contractAddress: string,
    sender: string,
  ): Promise<{ txXdr: string }> {
    return this.prepareStateChange(sender, contractAddress, 'pause', sender);
  }

  /** Prepare a `resume(sender)` invocation; the sender signs. */
  async resume(
    contractAddress: string,
    sender: string,
  ): Promise<{ txXdr: string }> {
    return this.prepareStateChange(sender, contractAddress, 'resume', sender);
  }

  /** Prepare a `cancel(sender)` invocation; the sender signs. */
  async cancel(
    contractAddress: string,
    sender: string,
  ): Promise<{ txXdr: string }> {
    return this.prepareStateChange(sender, contractAddress, 'cancel', sender);
  }

  // ─── Internals ───────────────────────────────────────────────────────────

  private async prepareStateChange(
    caller: string,
    contractAddress: string,
    method: string,
    authArg: string,
  ): Promise<{ txXdr: string }> {
    const prepared = await this.stellarService.prepareInvocationXdr(
      caller,
      contractAddress,
      method,
      [addressToScVal(authArg)],
    );
    if (!prepared.ok) {
      throw new BadRequestException({
        message: prepared.message,
        code: prepared.code,
      });
    }
    return { txXdr: prepared.txXdr };
  }

  private streamFromInfo(contractAddress: string, info: unknown): Stream {
    const i = info as Record<string, unknown>;
    return {
      contractAddress,
      streamId: null,
      sender: String(i.sender),
      recipient: String(i.recipient),
      asset: String(i.asset),
      flowRate: String(i.flow_rate),
      totalAmount: String(i.total_amount),
      withdrawnAmount: String(i.withdrawn_amount ?? 0),
      startTime: String(i.start_time),
      lastUpdateTime: String(i.last_update_time),
      status: this.mapStatus(i.status),
    } as Stream;
  }

  private mapStatus(status: unknown): string {
    const discriminant = Array.isArray(status) ? status[0] : status;
    return (
      STATUS_BY_DISCRIMINANT[Number(discriminant)] ??
      String(discriminant ?? 'active')
    );
  }
}