import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StreamNftController } from './stream-nft.controller';
import { StreamNftService } from './stream-nft.service';
import { StreamNft } from './entities/stream-nft.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StreamNft])],
  controllers: [StreamNftController],
  providers: [StreamNftService],
})
export class StreamNftModule {}
