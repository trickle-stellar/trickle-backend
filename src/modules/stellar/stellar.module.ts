import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StellarService } from './stellar.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [StellarService],
  exports: [StellarService],
})
export class StellarModule {}
