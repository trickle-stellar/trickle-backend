import { Test, TestingModule } from '@nestjs/testing';
import { StellarService } from './stellar.service';
import { ConfigService } from '@nestjs/config';

describe('StellarService', () => {
  let service: StellarService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        'stellar.horizonUrl': 'https://horizon-testnet.stellar.org',
        'stellar.sorobanRpcUrl': 'https://soroban-testnet.stellar.org',
        'stellar.networkPassphrase': 'Test SDF Network ; September 2015',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StellarService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<StellarService>(StellarService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getNetworkPassphrase should return the configured passphrase', () => {
    service.onModuleInit();
    expect(service.getNetworkPassphrase()).toBe('Test SDF Network ; September 2015');
  });

  it('getContractData should throw not implemented', async () => {
    service.onModuleInit();
    await expect(service.getContractData('CABC', 'Config')).rejects.toThrow(
      'not implemented',
    );
  });
});
