import { Test, TestingModule } from '@nestjs/testing';
import { FactoryService } from './factory.service';
import { StellarService } from '../stellar/stellar.service';

describe('FactoryService', () => {
  let service: FactoryService;

  const mockStellarService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FactoryService,
        { provide: StellarService, useValue: mockStellarService },
      ],
    }).compile();

    service = module.get<FactoryService>(FactoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('createStream should throw not implemented', async () => {
    await expect(
      service.createStream('sender', 'recipient', 'asset', '100', 86400),
    ).rejects.toThrow('not implemented');
  });
});
