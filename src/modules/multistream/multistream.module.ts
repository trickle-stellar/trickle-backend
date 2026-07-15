import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MultistreamController } from './multistream.controller';
import { MultiStreamService } from './multistream.service';
import { Multistream } from './entities/multistream.entity';
import { MultistreamRecipient } from './entities/multistream-recipient.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Multistream, MultistreamRecipient])],
  controllers: [MultistreamController],
  providers: [MultiStreamService],
})
export class MultistreamModule {}
