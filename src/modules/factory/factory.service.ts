import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StellarService } from '../stellar/stellar.service';
import {
  addressToScVal,
  i128ToScVal,
  u32ToScVal,
} from '../../common/soroban/scval';

export const FACTORY_NOT_CONFIGURED_MESSAGE =
  'factory.contractAddress is not set — deploy the factory contract and set ' +
  'FACTORY_CONTRACT_ADDRESS';

/**
 * FactoryService wraps interactions with the factory contract.
 *
 * The factory is the entry point for creating streams:
 *   factory.create_stream(sender, recipient, asset, amount, duration)
 *   → deploys a new stream contract instance
 *   → transfers `amount` into escrow
 *   → returns the stream contract address
 *
 * This service builds the transaction XDR that the client signs with Freighter,
 * and exposes the factory's read-only registry lookups.
 */
@Injectable()
export class FactoryService {
  private readonly logger = new Logger(FactoryService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly stellarService: StellarService,
  ) {}

  /**
   * Prepare a `create_stream` invocation for the sender to sign.
   *
   * Fails fast with a clear 503 when the factory is not deployed/configured,
   * and maps contract-level rejections during preparation (e.g. ZeroAmount,
   * InvalidFlowRate) to 400 responses. Transport/infrastructure failures
   * propagate as StellarException.
   *
   * @returns An XDR to sign with Freighter, plus the factory address the
   *   transaction targets (so the client can verify what it will submit).
   */
  async createStream(
    sender: string,
    recipient: string,
    asset: string,
    amount: string,
    duration: number,
  ): Promise<{ txXdr: string; factoryAddress: string }> {
    const factoryAddress = this.getFactoryAddress();

    if (!/^\d+$/.test(amount) || BigInt(amount) <= 0n) {
      throw new BadRequestException('amount must be a positive integer');
    }
    if (!Number.isInteger(duration) || duration <= 0) {
      throw new BadRequestException('duration must be a positive integer (seconds)');
    }

    const prepared = await this.stellarService.prepareInvocationXdr(
      sender,
      factoryAddress,
      'create_stream',
      [
        addressToScVal(sender),
        addressToScVal(recipient),
        addressToScVal(asset),
        i128ToScVal(amount),
        u32ToScVal(duration),
      ],
    );

    if (!prepared.ok) {
      throw new BadRequestException({
        message: prepared.message,
        code: prepared.code,
      });
    }

    this.logger.debug(`createStream() prepared for ${sender}`);
    return { txXdr: prepared.txXdr, factoryAddress };
  }

  /** Cached stream metadata by stream ID (factory registry lookup). */
  async getStream(streamId: number): Promise<unknown> {
    const result = await this.stellarService.simulateContractCall(
      this.getFactoryAddress(),
      'get_stream',
      [u32ToScVal(streamId)],
    );

    if (result.status === 'rejected') {
      throw new NotFoundException({
        message: result.message,
        code: result.code,
      });
    }
    return result.native;
  }

  /** All stream IDs created by a given sender. */
  async getStreamsBySender(address: string): Promise<unknown> {
    return this.readStreamIdList('get_streams_by_sender', address);
  }

  /** All stream IDs paying out to a given recipient. */
  async getStreamsByRecipient(address: string): Promise<unknown> {
    return this.readStreamIdList('get_streams_by_recipient', address);
  }

  private async readStreamIdList(
    method: string,
    address: string,
  ): Promise<unknown> {
    const result = await this.stellarService.simulateContractCall(
      this.getFactoryAddress(),
      method,
      [addressToScVal(address)],
    );

    if (result.status === 'rejected') {
      throw new BadRequestException({
        message: result.message,
        code: result.code,
      });
    }
    return result.native;
  }

  private getFactoryAddress(): string {
    const address = this.config.get<string>('factory.contractAddress');
    if (!address || !address.startsWith('C')) {
      throw new ServiceUnavailableException(FACTORY_NOT_CONFIGURED_MESSAGE);
    }
    return address;
  }
}