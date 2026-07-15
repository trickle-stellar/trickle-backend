import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FeesService } from './fees.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('fees')
@Controller('fees')
export class FeesController {
  constructor(private feesService: FeesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get fee information' })
  getFeeInfo() {
    return this.feesService.getFeeInfo();
  }

  @Get('calculate')
  @Public()
  @ApiOperation({ summary: 'Calculate fee for an amount' })
  calculateFee(@Query('asset') asset: string, @Query('amount') amount: string) {
    return this.feesService.calculateFee(asset, amount);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set fee percentage (admin)' })
  setFeePercentage(@Body() body: { admin: string; percentage: number }) {
    return this.feesService.setFeePercentage(body.admin, body.percentage);
  }

  @Post('withdraw')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Withdraw accumulated fees (admin)' })
  withdrawFees(@Body() body: { admin: string; asset: string }) {
    return this.feesService.withdrawFees(body.admin, body.asset);
  }
}
