import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('vesting_schedules')
export class VestingSchedule extends BaseEntity {
  @Column()
  @Index({ unique: true })
  contractAddress: string;

  @Column()
  beneficiary: string;

  @Column()
  asset: string;

  @Column({ type: 'bigint' })
  totalAmount: string;

  @Column({ type: 'bigint' })
  vestedAmount: string;

  @Column({ type: 'bigint' })
  startTime: string;

  @Column({ type: 'bigint' })
  cliffDuration: string;

  @Column({ type: 'bigint' })
  vestingDuration: string;

  @Column({ type: 'varchar', default: 'active' })
  status: string;

  @Column({ default: false })
  revocable: boolean;

  @Column({ type: 'bigint', nullable: true })
  revocationTime: string | null;
}
