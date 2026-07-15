import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StellarService } from '../stellar/stellar.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stream } from '../stream/entities/stream.entity';

/**
 * StateSyncService periodically syncs on-chain contract state to Postgres.
 *
 * Flow:
 *   1. Every N minutes, query all known contract addresses from Postgres
 *   2. Call getContractData() on each contract via Soroban RPC
 *   3. Update the Postgres records with latest state (balance, status, etc.)
 *
 * This keeps the local DB in sync so clients can query cached state
 * without making Soroban RPC calls. Real-time balance queries still
 * go directly to Soroban RPC (getClaimable endpoints).
 *
 * TODO: All methods are stubs. Implement when:
 *   - StellarService.getContractData() is implemented
 *   - Contract storage structures are finalized
 */
@Injectable()
export class StateSyncService {
  private readonly logger = new Logger(StateSyncService.name);

  constructor(
    @InjectRepository(Stream)
    private streamRepository: Repository<Stream>,
    private stellarService: StellarService,
  ) {}

  /**
   * Sync all known contract states.
   * Called automatically by cron every 15 minutes.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async syncAllStates(): Promise<void> {
    this.logger.debug('StateSyncService.syncAllStates() — cron triggered');
    // TODO: Implement full sync:
    //   1. Query all unique contract addresses from Postgres
    //   2. For each, call getContractData() via Soroban RPC
    //   3. Update Postgres record
    //   4. Log failures but continue with other contracts
  }

  /**
   * Manual sync for a specific contract.
   */
  async syncContract(contractAddress: string): Promise<void> {
    this.logger.debug(`syncContract(${contractAddress})`);
    // TODO: Implement single-contract sync
    throw new Error('Not implemented');
  }
}
