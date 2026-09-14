import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StreamController } from './stream.controller';
import { StreamService } from './stream.service';
import { Stream } from './entities/stream.entity';
import { FactoryModule } from '../factory/factory.module';

@Module({
  imports: [TypeOrmModule.forFeature([Stream]), FactoryModule],
  controllers: [StreamController],
  providers: [StreamService],
  exports: [StreamService],
})
export class StreamModule {}
