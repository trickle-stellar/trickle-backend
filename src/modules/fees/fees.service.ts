import { Injectable, Logger } from '@nestjs/common';
import { StellarService } from '../stellar/stellar.service';

/**
 * FeesService wraps the fees contract interactions.
 *
 * The fees contract determines the fee structure for the platform.
 * Fees are taken as a percentage of streamed amounts and can be
 * configured per asset or globally.
 *
 * TODO: All methods are stubs. The fees Soroban contract
 *   functions are also stubs (todo!()). When the contract is
 *   implemented, build the corresponding XDR methods here.
 */
@Injectable()
export class FeesService {
  private readonly logger = new Logger(FeesService.name);

  constructor(private stellarService: StellarService) {}

  async getFeeInfo(): Promise<any> {
    // TODO: Query fees contract state
    throw new Error('Not implemented');
  }

  async setFeePercentage(
    admin: string,
    percentage: number,
  ): Promise<{ txXdr: string }> {
    // TODO: Build fees.set_percentage() XDR
    throw new Error('Not implemented');
  }

  async withdrawFees(
    admin: string,
    asset: string,
  ): Promise<{ txXdr: string }> {
    // TODO: Build fees.withdraw() XDR
    throw new Error('Not implemented');
  }

  async calculateFee(
    asset: string,
    amount: string,
  ): Promise<{ fee: string }> {
    // TODO: Simulate fees.calculate() via Soroban RPC
    return { fee: '0' };
  }
}
