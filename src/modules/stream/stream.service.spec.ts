import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StreamService } from './stream.service';
import { Stream } from './entities/stream.entity';
import { StellarService } from '../stellar/stellar.service';

describe('StreamService', () => {
  let service: StreamService;

  const mockStreamRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockStellarService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StreamService,
        { provide: getRepositoryToken(Stream), useValue: mockStreamRepo },
        { provide: StellarService, useValue: mockStellarService },
      ],
    }).compile();

    service = module.get<StreamService>(StreamService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStreamInfo', () => {
    it('should throw NotFoundException when stream not found', async () => {
      mockStreamRepo.findOne.mockResolvedValue(null);
      await expect(service.getStreamInfo('CABC')).rejects.toThrow(
        'Stream CABC not found',
      );
    });

    it('should return stream when found', async () => {
      const mockStream = { contractAddress: 'CABC', sender: 'GDEF' };
      mockStreamRepo.findOne.mockResolvedValue(mockStream);
      const result = await service.getStreamInfo('CABC');
      expect(result.contractAddress).toBe('CABC');
    });
  });

  describe('getClaimableBalance', () => {
    it('should return zero claimable (stub)', async () => {
      const result = await service.getClaimableBalance('CABC');
      expect(result.claimable).toBe('0');
    });
  });

  describe('getStreamsBySender', () => {
    it('should return array of streams', async () => {
      mockStreamRepo.find.mockResolvedValue([]);
      const result = await service.getStreamsBySender('GDEF');
      expect(result).toEqual([]);
    });
  });
});
