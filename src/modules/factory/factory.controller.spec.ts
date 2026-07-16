import { Test, TestingModule } from '@nestjs/testing';
import { FactoryController } from './factory.controller';
import { FactoryService } from './factory.service';

describe('FactoryController', () => {
  let controller: FactoryController;

  const mockFactoryService = {
    createStream: jest.fn().mockResolvedValue({ txXdr: 'mock-xdr', factoryAddress: 'CFACT' }),
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
});
