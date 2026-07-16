import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StreamNftService } from './stream-nft.service';
import { StreamNft } from './entities/stream-nft.entity';
import { StellarService } from '../stellar/stellar.service';

describe('StreamNftService', () => {
  let service: StreamNftService;

  const mockRepo = { findOne: jest.fn(), find: jest.fn() };
  const mockStellarService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StreamNftService,
        { provide: getRepositoryToken(StreamNft), useValue: mockRepo },
        { provide: StellarService, useValue: mockStellarService },
      ],
    }).compile();

    service = module.get<StreamNftService>(StreamNftService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create should throw not implemented', async () => {
    await expect(service.create('GDEF', 'CABC')).rejects.toThrow(
      'Not implemented',
    );
  });
});
