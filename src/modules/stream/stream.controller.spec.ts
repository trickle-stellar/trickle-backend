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
    createStream: jest
      .fn()
      .mockResolvedValue({ txXdr: 'xdr', factoryAddress: 'CFACTORY' }),
    submit: jest
      .fn()
      .mockResolvedValue({ status: 'confirmed', hash: 'h', streamAddress: 'CSTR' }),
    withdraw: jest.fn().mockResolvedValue({ txXdr: 'wdr' }),
    pause: jest.fn().mockResolvedValue({ txXdr: 'pdr' }),
    resume: jest.fn().mockResolvedValue({ txXdr: 'rdr' }),
    cancel: jest.fn().mockResolvedValue({ txXdr: 'cdr' }),
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

  it('should delegate createStream', async () => {
    const result = await controller.createStream({
      sender: 'GA',
      recipient: 'GB',
      asset: 'GC',
      amount: '100',
      duration: 86400,
    });
    expect(result).toEqual({ txXdr: 'xdr', factoryAddress: 'CFACTORY' });
    expect(mockStreamService.createStream).toHaveBeenCalledWith(
      'GA',
      'GB',
      'GC',
      '100',
      86400,
    );
  });

  it('should delegate submit', async () => {
    const result = await controller.submit({ signedXdr: 'signed' });
    expect(result).toEqual({
      status: 'confirmed',
      hash: 'h',
      streamAddress: 'CSTR',
    });
    expect(mockStreamService.submit).toHaveBeenCalledWith('signed');
  });

  it.each([
    { arg: 'GB', method: 'withdraw' },
    { arg: 'GA', method: 'pause' },
    { arg: 'GA', method: 'resume' },
    { arg: 'GA', method: 'cancel' },
  ])('should delegate $method', async ({ arg, method }) => {
    const result = await controller[method]('CABC', { sender: arg, recipient: arg });
    expect(result).toEqual({ txXdr: `${method === 'withdraw' ? 'w' : method[0]}dr` });
    expect(mockStreamService[method]).toHaveBeenCalledWith('CABC', arg);
  });
});