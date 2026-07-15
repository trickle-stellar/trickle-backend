import { Module } from '@nestjs/common';
import { FactoryController } from './factory.controller';
import { FactoryService } from './factory.service';

@Module({
  controllers: [FactoryController],
  providers: [FactoryService],
})
export class FactoryModule {}
