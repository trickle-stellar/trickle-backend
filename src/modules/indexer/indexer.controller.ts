import { Controller, Get, Query, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EventIndexerService } from './event-indexer.service';
import { StateSyncService } from './state-sync.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('indexer')
@Controller('indexer')
export class IndexerController {
  constructor(
    private eventIndexer: EventIndexerService,
    private stateSync: StateSyncService,
  ) {}

  @Get('events')
  @Public()
  @ApiOperation({ summary: 'Query historical events' })
  getEvents(
    @Query('contract') contract?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.eventIndexer.getEvents(
      contract,
      type,
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );
  }

  @Post('sync/:address')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually trigger state sync for a contract' })
  syncContract(@Param('address') address: string) {
    return this.stateSync.syncContract(address);
  }
}
