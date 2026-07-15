import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { MultistreamRecipient } from './multistream-recipient.entity';

@Entity('multistreams')
export class Multistream extends BaseEntity {
  @Column()
  @Index({ unique: true })
  contractAddress: string;

  @Column()
  sender: string;

  @Column()
  asset: string;

  @Column({ type: 'bigint' })
  totalAmount: string;

  @Column({ type: 'int' })
  duration: number;

  @Column({ type: 'bigint' })
  flowRate: string;

  @Column({ type: 'bigint' })
  startTime: string;

  @Column({ type: 'bigint' })
  lastUpdateTime: string;

  @Column({ type: 'varchar', default: 'active' })
  status: string;

  @OneToMany(() => MultistreamRecipient, (r) => r.multistream)
  recipients: MultistreamRecipient[];
}
