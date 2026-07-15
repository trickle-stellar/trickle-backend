import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Multistream } from './multistream.entity';

@Entity('multistream_recipients')
export class MultistreamRecipient extends BaseEntity {
  @ManyToOne(() => Multistream, (m) => m.recipients, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'multistreamId' })
  multistream: Multistream;

  @Column()
  address: string;

  @Column({ type: 'int' })
  weight: number;
}
