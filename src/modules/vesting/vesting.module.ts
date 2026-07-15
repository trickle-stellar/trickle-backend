import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VestingController } from './vesting.controller';
import { VestingService } from './vesting.service';
import { VestingSchedule } from './entities/vesting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VestingSchedule])],
  controllers: [VestingController],
  providers: [VestingService],
})
export class VestingModule {}
