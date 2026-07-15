import { Injectable, Logger } from '@nestjs/common';
import { StellarService } from '../stellar/stellar.service';

/**
 * FactoryService wraps interactions with the factory contract.
 *
 * The factory is the entry point for creating streams:
 *   factory.create_stream(sender, recipient, asset, amount, duration)
 *   → deploys a new StreamContract instance
 *   → returns the stream contract address
 *
 * This service builds the transaction XDR that the client signs with Freighter.
 */
@Injectable()
export class FactoryService {
  private readonly logger = new Logger(FactoryService.name);

  constructor(private stellarService: StellarService) {}

  /**
   * Create a new stream via the factory contract.
   *
   * TODO: Implement the full flow:
   *   1. Load the factory contract address from config
   *   2. Build a transaction with factory.create_stream() operation
   *   3. Return the XDR for client signing
   *
   * @returns Transaction XDR for Freighter to sign
   */
  async createStream(
    sender: string,
    recipient: string,
    asset: string,
    amount: string,
    duration: number,
  ): Promise<{ txXdr: string; factoryAddress: string }> {
    this.logger.debug(`createStream()`);

    // TODO: Implement
    //   const factoryAddress = this.config.get('factory.contractAddress');
    //   const account = await this.stellarService.getAccountSequence(sender);
    //   const txBuilder = new TransactionBuilder(account, { fee: BASE_FEE });
    //   const tx = txBuilder
    //     .addOperation(factoryContract.call('create_stream', ...))
    //     .build();
    //   return { txXdr: tx.toXDR(), factoryAddress };

    throw new Error('FactoryService.createStream() not implemented — see TODO');
  }
}
