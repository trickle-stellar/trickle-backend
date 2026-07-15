import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('stream_nfts')
export class StreamNft extends BaseEntity {
  @Column()
  @Index({ unique: true })
  contractAddress: string;

  @Column()
  streamContractAddress: string;

  @Column()
  owner: string;

  @Column({ type: 'bigint' })
  streamAmount: string;

  @Column({ type: 'bigint' })
  claimedAmount: string;

  @Column({ type: 'bigint' })
  remainingAmount: string;

  @Column({ type: 'varchar', default: 'active' })
  status: string;
}
