import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MultiStreamService } from './multistream.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('multistreams')
@Controller('multistreams')
export class MultistreamController {
  constructor(private multistreamService: MultiStreamService) {}

  @Get(':address')
  @Public()
  @ApiOperation({ summary: 'Get multistream info' })
  getInfo(@Param('address') address: string) {
    return this.multistreamService.getInfo(address);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create multistream' })
  create(
    @Body()
    body: { sender: string; asset: string; totalAmount: string; duration: number },
  ) {
    return this.multistreamService.create(
      body.sender, body.asset, body.totalAmount, body.duration,
    );
  }

  @Post(':address/recipients')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add recipient' })
  addRecipient(
    @Param('address') address: string,
    @Body() body: { sender: string; recipient: string; weight: number },
  ) {
    return this.multistreamService.addRecipient(
      address, body.sender, body.recipient, body.weight,
    );
  }

  @Delete(':address/recipients/:recipient')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove recipient' })
  removeRecipient(
    @Param('address') address: string,
    @Param('recipient') recipient: string,
    @Body() body: { sender: string },
  ) {
    return this.multistreamService.removeRecipient(
      address, body.sender, recipient,
    );
  }

  @Post(':address/withdraw')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Withdraw' })
  withdraw(@Param('address') address: string, @Body() body: { recipient: string }) {
    return this.multistreamService.withdraw(address, body.recipient);
  }

  @Get(':address/claimable/:recipient')
  @Public()
  @ApiOperation({ summary: 'Get claimable (real-time)' })
  getClaimable(
    @Param('address') address: string,
    @Param('recipient') recipient: string,
  ) {
    return this.multistreamService.getClaimable(address, recipient);
  }
}
