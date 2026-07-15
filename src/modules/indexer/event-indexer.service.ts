import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StellarService } from '../stellar/stellar.service';
import { StreamEvent } from './entities/stream-event.entity';
import { VestingEvent } from './entities/vesting-event.entity';
import { MultistreamEvent } from './entities/multistream-event.entity';

/**
 * EventIndexerService handles event-based indexing for all contract types.
 *
 * Flow:
 *   1. watchEvents() polls Soroban RPC for new events
 *   2. Events are classified and persisted to the appropriate entity table
 *   3. Clients can query historical events via GET /indexer/events
 *
 * TODO: All methods are stubs. When the Soroban contracts emit events,
 *   implement the event parsing logic in watchEvents(). The StellarService
 *   will need watchEvents() implemented first.
 */
@Injectable()
export class EventIndexerService {
  private readonly logger = new Logger(EventIndexerService.name);

  constructor(
    @InjectRepository(StreamEvent)
    private streamEventRepo: Repository<StreamEvent>,
    @InjectRepository(VestingEvent)
    private vestingEventRepo: Repository<VestingEvent>,
    @InjectRepository(MultistreamEvent)
    private multistreamEventRepo: Repository<MultistreamEvent>,
    private stellarService: StellarService,
  ) {}

  /**
   * Start watching events. Call on application bootstrap.
   *
   * TODO: Implement event polling loop:
   *   1. Start from last processed ledger (stored in DB or config)
   *   2. Use stellarService.watchEvents() to get new events
   *   3. Parse event type and data
   *   4. Persist to the correct entity table
   */
  async startWatching(): Promise<void> {
    this.logger.warn('EventIndexerService.startWatching() not implemented');
    // TODO: Implement event polling loop
  }

  async getEvents(
    contractAddress?: string,
    eventType?: string,
    limit = 50,
    offset = 0,
  ): Promise<any[]> {
    // TODO: Query events across all event tables
    //   UNION or separate queries depending on filter
    throw new Error('Not implemented');
  }
}
