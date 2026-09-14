import { Test, TestingModule } from '@nestjs/testing';
import { FactoryController } from './factory.controller';
import { FactoryService } from './factory.service';

describe('FactoryController', () => {
  let controller: FactoryController;

  const mockFactoryService = {
    getStream: jest.fn().mockResolvedValue({ status: 'ok' }),
    getStreamsBySender: jest.fn().mockResolvedValue([1, 2]),
    getStreamsByRecipient: jest.fn().mockResolvedValue([3]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FactoryController],
      providers: [{ provide: FactoryService, useValue: mockFactoryService }],
    }).compile();

    controller = module.get<FactoryController>(FactoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('exposes the factory registry getters only', () => {
    expect(typeof controller.getStream).toBe('function');
    expect(typeof controller.getStreamsBySender).toBe('function');
    expect(typeof controller.getStreamsByRecipient).toBe('function');
    expect((controller as unknown as Record<string, unknown>).createStream).toBeUndefined();
  });

  it('getStream delegates with a parsed numeric stream id', () => {
    expect(controller.getStream(3)).resolves.toEqual({ status: 'ok' });
    expect(mockFactoryService.getStream).toHaveBeenCalledWith(3);
  });

  it('getStreamsBySender delegates', () => {
    expect(controller.getStreamsBySender('GA')).resolves.toEqual([1, 2]);
    expect(mockFactoryService.getStreamsBySender).toHaveBeenCalledWith('GA');
  });

  it('getStreamsByRecipient delegates', () => {
    expect(controller.getStreamsByRecipient('GB')).resolves.toEqual([3]);
    expect(mockFactoryService.getStreamsByRecipient).toHaveBeenCalledWith('GB');
  });
});