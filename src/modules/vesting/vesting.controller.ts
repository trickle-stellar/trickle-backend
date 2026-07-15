import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VestingService } from './vesting.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('vesting')
@Controller('vesting')
export class VestingController {
  constructor(private vestingService: VestingService) {}

  @Get(':address')
  @Public()
  @ApiOperation({ summary: 'Get vesting schedule info' })
  getInfo(@Param('address') address: string) {
    return this.vestingService.getInfo(address);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create vesting schedule' })
  create(
    @Body()
    body: {
      sender: string;
      beneficiary: string;
      asset: string;
      totalAmount: string;
      cliffDuration: number;
      vestingDuration: number;
      revocable: boolean;
    },
  ) {
    return this.vestingService.create(
      body.sender, body.beneficiary, body.asset, body.totalAmount,
      body.cliffDuration, body.vestingDuration, body.revocable,
    );
  }

  @Post(':address/claim')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Claim vested tokens' })
  claim(@Param('address') address: string, @Body() body: { beneficiary: string }) {
    return this.vestingService.claim(address, body.beneficiary);
  }

  @Post(':address/revoke')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke vesting schedule' })
  revoke(@Param('address') address: string, @Body() body: { sender: string }) {
    return this.vestingService.revoke(address, body.sender);
  }

  @Get(':address/claimable/:beneficiary')
  @Public()
  @ApiOperation({ summary: 'Get claimable (real-time)' })
  getClaimable(
    @Param('address') address: string,
    @Param('beneficiary') beneficiary: string,
  ) {
    return this.vestingService.getClaimable(address, beneficiary);
  }
}
