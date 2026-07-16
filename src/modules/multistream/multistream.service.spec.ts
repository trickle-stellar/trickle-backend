import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MultiStreamService } from './multistream.service';
import { Multistream } from './entities/multistream.entity';
import { StellarService } from '../stellar/stellar.service';

describe('MultiStreamService', () => {
  let service: MultiStreamService;

  const mockRepo = { findOne: jest.fn(), find: jest.fn() };
  const mockStellarService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MultiStreamService,
        { provide: getRepositoryToken(Multistream), useValue: mockRepo },
        { provide: StellarService, useValue: mockStellarService },
      ],
    }).compile();

    service = module.get<MultiStreamService>(MultiStreamService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getClaimable should return zero (stub)', async () => {
    const result = await service.getClaimable('CABC', 'GDEF');
    expect(result.claimable).toBe('0');
  });
});
