import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StellarService } from '../stellar/stellar.service';
import { Multistream } from './entities/multistream.entity';

/**
 * MultiStreamService handles multi-recipient stream operations.
 *
 * The multistream contract splits a single funded stream across
 * multiple recipients based on assigned weights. Each recipient
 * can withdraw their proportional share at any time.
 *
 * TODO: All methods are stubs. The multistream Soroban contract
 *   functions are also stubs (todo!()). When the contract is
 *   implemented, build the corresponding XDR methods here.
 */
@Injectable()
export class MultiStreamService {
  private readonly logger = new Logger(MultiStreamService.name);

  constructor(
    @InjectRepository(Multistream)
    private multistreamRepository: Repository<Multistream>,
    private stellarService: StellarService,
  ) {}

  async getInfo(contractAddress: string): Promise<any> {
    // TODO: Query multistream contract state
    throw new Error('Not implemented');
  }

  async create(
    sender: string,
    asset: string,
    totalAmount: string,
    duration: number,
  ): Promise<{ txXdr: string }> {
    // TODO: Build multistream.initialize() XDR
    throw new Error('Not implemented');
  }

  async addRecipient(
    contractAddress: string,
    sender: string,
    recipient: string,
    weight: number,
  ): Promise<{ txXdr: string }> {
    // TODO: Build multistream.add_recipient() XDR
    throw new Error('Not implemented');
  }

  async removeRecipient(
    contractAddress: string,
    sender: string,
    recipient: string,
  ): Promise<{ txXdr: string }> {
    // TODO: Build multistream.remove_recipient() XDR
    throw new Error('Not implemented');
  }

  async withdraw(
    contractAddress: string,
    recipient: string,
  ): Promise<{ txXdr: string }> {
    // TODO: Build multistream.withdraw() XDR
    throw new Error('Not implemented');
  }

  async getClaimable(
    contractAddress: string,
    recipient: string,
  ): Promise<{ claimable: string }> {
    // TODO: Simulate multistream.get_claimable() via Soroban RPC
    return { claimable: '0' };
  }
}
