import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IndexerController } from './indexer.controller';
import { EventIndexerService } from './event-indexer.service';
import { StateSyncService } from './state-sync.service';
import { StreamEvent } from './entities/stream-event.entity';
import { VestingEvent } from './entities/vesting-event.entity';
import { MultistreamEvent } from './entities/multistream-event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([StreamEvent, VestingEvent, MultistreamEvent]),
  ],
  controllers: [IndexerController],
  providers: [EventIndexerService, StateSyncService],
})
export class IndexerModule {}
