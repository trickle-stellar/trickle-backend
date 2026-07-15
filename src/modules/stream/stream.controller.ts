import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { StreamService } from './stream.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('streams')
@Controller('streams')
export class StreamController {
  constructor(private streamService: StreamService) {}

  @Get(':address')
  @Public()
  @ApiOperation({ summary: 'Get stream info (cached)' })
  @ApiParam({ name: 'address', description: 'Stream contract address (C...)' })
  getStreamInfo(@Param('address') address: string) {
    return this.streamService.getStreamInfo(address);
  }

  @Get(':address/balance')
  @Public()
  @ApiOperation({
    summary: 'Get claimable balance (real-time)',
    description:
      'Queries the Soroban contract directly via RPC. ' +
      'This value changes every second and is never cached.',
  })
  @ApiParam({ name: 'address', description: 'Stream contract address (C...)' })
  getBalance(@Param('address') address: string) {
    return this.streamService.getClaimableBalance(address);
  }

  @Get('sender/:address')
  @Public()
  @ApiOperation({ summary: 'Get streams by sender' })
  getStreamsBySender(@Param('address') address: string) {
    return this.streamService.getStreamsBySender(address);
  }

  @Get('recipient/:address')
  @Public()
  @ApiOperation({ summary: 'Get streams by recipient' })
  getStreamsByRecipient(@Param('address') address: string) {
    return this.streamService.getStreamsByRecipient(address);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a stream',
    description:
      'Returns a transaction XDR for the client to sign with Freighter. ' +
      'After signing, submit the signed XDR to /streams/submit.',
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
    return this.streamService.createStream(
      body.sender,
      body.recipient,
      body.asset,
      body.amount,
      body.duration,
    );
  }

  @Post(':address/withdraw')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Withdraw accrued funds' })
  withdraw(
    @Param('address') address: string,
    @Body() body: { recipient: string },
  ) {
    return this.streamService.withdraw(address, body.recipient);
  }

  @Post(':address/pause')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pause stream' })
  pause(@Param('address') address: string, @Body() body: { sender: string }) {
    return this.streamService.pause(address, body.sender);
  }

  @Post(':address/resume')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resume stream' })
  resume(@Param('address') address: string, @Body() body: { sender: string }) {
    return this.streamService.resume(address, body.sender);
  }

  @Post(':address/cancel')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel stream' })
  cancel(@Param('address') address: string, @Body() body: { sender: string }) {
    return this.streamService.cancel(address, body.sender);
  }
}
