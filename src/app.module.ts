import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { StellarModule } from './modules/stellar/stellar.module';
import { StreamModule } from './modules/stream/stream.module';
import { FactoryModule } from './modules/factory/factory.module';
import { MultistreamModule } from './modules/multistream/multistream.module';
import { VestingModule } from './modules/vesting/vesting.module';
import { StreamNftModule } from './modules/stream-nft/stream-nft.module';
import { FeesModule } from './modules/fees/fees.module';
import { IndexerModule } from './modules/indexer/indexer.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    StellarModule,
    StreamModule,
    FactoryModule,
    MultistreamModule,
    VestingModule,
    StreamNftModule,
    FeesModule,
    IndexerModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
