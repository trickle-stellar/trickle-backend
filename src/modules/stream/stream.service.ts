import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StellarService } from '../stellar/stellar.service';
import { Stream } from './entities/stream.entity';

/**
 * StreamService handles all business logic for payment streams.
 *
 * Two types of operations:
 * 1. **Cached reads** — stream info, sender/recipient lookups
 *    → served from Postgres (fast, indexed)
 * 2. **Real-time reads** — claimable balance
 *    → always queried directly from the Soroban contract via RPC
 *    → NEVER cached, since the value changes every second
 *
 * This distinction is a critical architectural decision.
 * See README.md for the full explanation.
 */
@Injectable()
export class StreamService {
  private readonly logger = new Logger(StreamService.name);

  constructor(
    @InjectRepository(Stream)
    private streamRepository: Repository<Stream>,
    private stellarService: StellarService,
  ) {}

  /**
   * Get stream info from the local database (cached).
   *
   * This is fast because it's a simple Postgres query.
   * The data is synced by the indexer module (see indexer/).
   *
   * TODO: After the indexer is implemented, this will return
   *   the most recently synced state. Until then, it falls back
   *   to querying the contract directly via Soroban RPC.
   */
  async getStreamInfo(contractAddress: string): Promise<Stream> {
    const stream = await this.streamRepository.findOne({
      where: { contractAddress },
    });

    if (!stream) {
      // Fallback: query contract directly via Soroban RPC
      // TODO: Implement after StellarService.getContractData() is built
      throw new NotFoundException(
        `Stream ${contractAddress} not found. Run the indexer to sync stream state.`,
      );
    }

    return stream;
  }

  /**
   * Get the current claimable balance — ALWAYS from the contract.
   *
   * This is the ONE query that must never be cached.
   * The claimable amount changes every second as tokens stream,
   * so we query the Soroban contract directly via RPC simulation.
   *
   * This calls stream.get_balance() on the Soroban contract.
   */
  async getClaimableBalance(contractAddress: string): Promise<{ claimable: string }> {
    this.logger.debug(`getClaimableBalance(${contractAddress})`);

    // TODO: Implement via StellarService.simulateContractCall()
    //   const result = await this.stellarService.simulateContractCall(
    //     contractAddress,
    //     'get_balance',
    //     [],
    //   );
    //   return { claimable: result.toString() };

    // Temporary: return 0 until Soroban RPC integration is complete
    this.logger.warn(
      `getClaimableBalance: Soroban RPC not yet connected, returning 0`,
    );
    return { claimable: '0' };
  }

  /**
   * Get all streams created by a given sender.
   */
  async getStreamsBySender(sender: string): Promise<Stream[]> {
    return this.streamRepository.find({
      where: { sender },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get all streams where a given address is the recipient.
   */
  async getStreamsByRecipient(recipient: string): Promise<Stream[]> {
    return this.streamRepository.find({
      where: { recipient },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Create a new stream via the factory contract.
   *
   * TODO: Implement the full flow:
   *   1. Build a factory.create_stream() transaction XDR
   *   2. Return the XDR to the client for signing via Freighter
   *   3. Client signs and sends back the signed XDR
   *   4. Backend submits via StellarService.submitTransaction()
   *   5. Parse the transaction result to get the new stream contract address
   *   6. Store the stream in Postgres (optimistic: set status=active)
   *
   * For the scaffold, this is a stub.
   */
  async createStream(
    sender: string,
    recipient: string,
    asset: string,
    amount: string,
    duration: number,
  ): Promise<{ txXdr: string }> {
    this.logger.debug(
      `createStream(${sender}, ${recipient}, ${asset}, ${amount}, ${duration})`,
    );

    // TODO: Implement
    //   1. Build XDR: factory.create_stream(sender, recipient, asset, amount, duration)
    //   2. Return XDR for Freighter signing
    //
    // The factory contract address comes from config:
    //   const factoryAddress = this.config.get('factory.contractAddress');

    throw new Error(
      'StreamService.createStream() not implemented — see TODO comments',
    );
  }

  /**
   * Withdraw accrued funds from a stream.
   *
   * TODO: Build and return a withdraw transaction XDR.
   *   The client signs it with Freighter, then submits via the backend.
   */
  async withdraw(
    contractAddress: string,
    recipient: string,
  ): Promise<{ txXdr: string }> {
    // TODO: Build stream.withdraw(recipient) XDR
    throw new Error('StreamService.withdraw() not implemented — see TODO');
  }

  /**
   * Pause a stream.
   */
  async pause(
    contractAddress: string,
    sender: string,
  ): Promise<{ txXdr: string }> {
    // TODO: Build stream.pause(sender) XDR
    throw new Error('StreamService.pause() not implemented — see TODO');
  }

  /**
   * Resume a paused stream.
   */
  async resume(
    contractAddress: string,
    sender: string,
  ): Promise<{ txXdr: string }> {
    // TODO: Build stream.resume(sender) XDR
    throw new Error('StreamService.resume() not implemented — see TODO');
  }

  /**
   * Cancel a stream. Accrued funds go to recipient, remainder to sender.
   */
  async cancel(
    contractAddress: string,
    sender: string,
  ): Promise<{ txXdr: string }> {
    // TODO: Build stream.cancel(sender) XDR
    throw new Error('StreamService.cancel() not implemented — see TODO');
  }
}
