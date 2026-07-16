import { Test, TestingModule } from '@nestjs/testing';
import { StreamController } from './stream.controller';
import { StreamService } from './stream.service';

describe('StreamController', () => {
  let controller: StreamController;

  const mockStreamService = {
    getStreamInfo: jest.fn().mockResolvedValue({ contractAddress: 'CABC' }),
    getClaimableBalance: jest.fn().mockResolvedValue({ claimable: '0' }),
    getStreamsBySender: jest.fn().mockResolvedValue([]),
    getStreamsByRecipient: jest.fn().mockResolvedValue([]),
    createStream: jest.fn().mockRejectedValue(new Error('Not implemented')),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StreamController],
      providers: [{ provide: StreamService, useValue: mockStreamService }],
    }).compile();

    controller = module.get<StreamController>(StreamController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get stream info', async () => {
    const result = await controller.getStreamInfo('CABC');
    expect(result.contractAddress).toBe('CABC');
  });

  it('should get claimable balance', async () => {
    const result = await controller.getBalance('CABC');
    expect(result.claimable).toBe('0');
  });
});
