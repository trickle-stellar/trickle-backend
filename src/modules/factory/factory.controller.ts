import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FactoryService } from './factory.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('streams')
@Controller('streams')
export class FactoryController {
  constructor(private factoryService: FactoryService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a stream via the factory contract',
    description:
      'Returns a transaction XDR. Sign with Freighter, then submit.',
  })
  createStream(
    @Body()
    body: {
      sender: string;
      recipient: string;
      asset: string;
      amount: string;
      duration: number;
    },
  ) {
    return this.factoryService.createStream(
      body.sender,
      body.recipient,
      body.asset,
      body.amount,
      body.duration,
    );
  }
}
