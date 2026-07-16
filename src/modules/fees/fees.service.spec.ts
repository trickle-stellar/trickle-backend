import { Test, TestingModule } from '@nestjs/testing';
import { FeesService } from './fees.service';
import { StellarService } from '../stellar/stellar.service';

describe('FeesService', () => {
  let service: FeesService;

  const mockStellarService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeesService,
        { provide: StellarService, useValue: mockStellarService },
      ],
    }).compile();

    service = module.get<FeesService>(FeesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('calculateFee should return zero (stub)', async () => {
    const result = await service.calculateFee('CABC', '1000000');
    expect(result.fee).toBe('0');
  });
});
