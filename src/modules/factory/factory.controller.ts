import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { FactoryService } from './factory.service';
import { Public } from '../../common/decorators/public.decorator';

/**
 * Read-only views over the factory contract's stream registry.
 *
 * Stream creation lives on `POST /streams` (StreamController) — this
 * controller deliberately exposes no write endpoints.
 */
@ApiTags('factory')
@Controller('factory')
export class FactoryController {
  constructor(private factoryService: FactoryService) {}

  @Get('streams/:streamId')
  @Public()
  @ApiOperation({ summary: 'Get cached stream metadata by stream ID' })
  @ApiParam({ name: 'streamId', description: 'Stream ID (factory registry)' })
  getStream(@Param('streamId', ParseIntPipe) streamId: number) {
    return this.factoryService.getStream(streamId);
  }

  @Get('sender/:address')
  @Public()
  @ApiOperation({ summary: 'Get stream IDs created by a sender' })
  getStreamsBySender(@Param('address') address: string) {
    return this.factoryService.getStreamsBySender(address);
  }

  @Get('recipient/:address')
  @Public()
  @ApiOperation({ summary: 'Get stream IDs paying out to a recipient' })
  getStreamsByRecipient(@Param('address') address: string) {
    return this.factoryService.getStreamsByRecipient(address);
  }
}