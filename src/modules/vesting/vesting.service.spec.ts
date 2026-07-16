import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VestingService } from './vesting.service';
import { VestingSchedule } from './entities/vesting.entity';
import { StellarService } from '../stellar/stellar.service';

describe('VestingService', () => {
  let service: VestingService;

  const mockRepo = { findOne: jest.fn(), find: jest.fn() };
  const mockStellarService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VestingService,
        { provide: getRepositoryToken(VestingSchedule), useValue: mockRepo },
        { provide: StellarService, useValue: mockStellarService },
      ],
    }).compile();

    service = module.get<VestingService>(VestingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getClaimable should return zero (stub)', async () => {
    const result = await service.getClaimable('CABC', 'GDEF');
    expect(result.claimable).toBe('0');
  });
});
