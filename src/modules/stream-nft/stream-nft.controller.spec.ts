import { Test, TestingModule } from '@nestjs/testing';
import { StreamNftController } from './stream-nft.controller';
import { StreamNftService } from './stream-nft.service';

describe('StreamNftController', () => {
  let controller: StreamNftController;

  const mockNftService = {
    getInfo: jest.fn().mockResolvedValue({ contractAddress: 'CNFT' }),
    create: jest.fn().mockRejectedValue(new Error('Not implemented')),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StreamNftController],
      providers: [{ provide: StreamNftService, useValue: mockNftService }],
    }).compile();

    controller = module.get<StreamNftController>(StreamNftController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getInfo should return nft info', async () => {
    const result = await controller.getInfo('CNFT');
    expect(result.contractAddress).toBe('CNFT');
  });
});
