import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('vesting_events')
@Index(['contractAddress', 'eventType'])
export class VestingEvent extends BaseEntity {
  @Column()
  contractAddress: string;

  @Column()
  txHash: string;

  @Column()
  eventType: string;

  @Column()
  caller: string;

  @Column({ type: 'bigint', nullable: true })
  amount: string | null;

  @Column({ type: 'int' })
  ledger: number;

  @Column({ type: 'bigint' })
  ledgerTimestamp: string;
}
