import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('multistream_events')
@Index(['contractAddress', 'eventType'])
export class MultistreamEvent extends BaseEntity {
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
