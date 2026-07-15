import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StreamNftService } from './stream-nft.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('stream-nft')
@Controller('stream-nft')
export class StreamNftController {
  constructor(private nftService: StreamNftService) {}

  @Get(':address')
  @Public()
  @ApiOperation({ summary: 'Get stream NFT info' })
  getInfo(@Param('address') address: string) {
    return this.nftService.getInfo(address);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create stream NFT from stream contract' })
  create(@Body() body: { sender: string; streamContractAddress: string }) {
    return this.nftService.create(body.sender, body.streamContractAddress);
  }

  @Post(':address/transfer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Transfer stream NFT' })
  transfer(
    @Param('address') address: string,
    @Body() body: { from: string; to: string },
  ) {
    return this.nftService.transfer(address, body.from, body.to);
  }

  @Post(':address/withdraw')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Withdraw from stream NFT' })
  withdraw(@Param('address') address: string, @Body() body: { owner: string }) {
    return this.nftService.withdraw(address, body.owner);
  }
}
