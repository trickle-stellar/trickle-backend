import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  StellarService,
  SOROBAN_RPC_CLIENT,
  HORIZON_CLIENT,
} from './stellar.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    StellarService,
    { provide: SOROBAN_RPC_CLIENT, useValue: null },
    { provide: HORIZON_CLIENT, useValue: null },
  ],
  exports: [StellarService],
})
export class StellarModule {}