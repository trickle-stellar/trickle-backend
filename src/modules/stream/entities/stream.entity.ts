import {
  Entity,
  Column,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('streams')
export class Stream extends BaseEntity {
  /** Stellar address of the deployed stream contract (C...) */
  @Column()
  @Index({ unique: true })
  contractAddress: string;

  /** The factory stream ID for registry lookups */
  @Column({ type: 'int', nullable: true })
  streamId: number | null;

  /** Address that funded and controls the stream */
  @Column()
  sender: string;

  /** Address that receives streamed funds */
  @Column()
  recipient: string;

  /** Token contract address (XLM, USDC, etc.) */
  @Column()
  asset: string;

  /** Tokens per second (total_amount / duration) */
  @Column({ type: 'bigint' })
  flowRate: string;

  /** Total tokens deposited into escrow */
  @Column({ type: 'bigint' })
  totalAmount: string;

  /** Total tokens withdrawn so far */
  @Column({ type: 'bigint', default: '0' })
  withdrawnAmount: string;

  /** Ledger timestamp when streaming started */
  @Column({ type: 'bigint' })
  startTime: string;

  /** Ledger timestamp of last state change */
  @Column({ type: 'bigint' })
  lastUpdateTime: string;

  /** Current stream status */
  @Column({ type: 'varchar', default: 'active' })
  status: string;
}
