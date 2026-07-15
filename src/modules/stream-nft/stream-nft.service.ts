import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StellarService } from '../stellar/stellar.service';
import { StreamNft } from './entities/stream-nft.entity';

/**
 * StreamNftService wraps the stream-nft contract interactions.
 *
 * The stream-nft contract turns a stream into a tradeable NFT.
 * Once created, the NFT holder can:
 *   - Withdraw from the stream
 *   - Transfer the stream (NFT) to another wallet
 *
 * TODO: All methods are stubs. The stream-nft Soroban contract
 *   functions are also stubs (todo!()). When the contract is
 *   implemented, build the corresponding XDR methods here.
 */
@Injectable()
export class StreamNftService {
  private readonly logger = new Logger(StreamNftService.name);

  constructor(
    @InjectRepository(StreamNft)
    private nftRepository: Repository<StreamNft>,
    private stellarService: StellarService,
  ) {}

  async getInfo(contractAddress: string): Promise<any> {
    // TODO: Query stream-nft contract state
    throw new Error('Not implemented');
  }

  async create(
    sender: string,
    streamContractAddress: string,
  ): Promise<{ txXdr: string }> {
    // TODO: Build stream-nft.create_nft() XDR
    throw new Error('Not implemented');
  }

  async transfer(
    contractAddress: string,
    from: string,
    to: string,
  ): Promise<{ txXdr: string }> {
    // TODO: Build stream-nft.transfer() XDR
    throw new Error('Not implemented');
  }

  async withdraw(
    contractAddress: string,
    owner: string,
  ): Promise<{ txXdr: string }> {
    // TODO: Build stream-nft.withdraw() XDR
    throw new Error('Not implemented');
  }
}
