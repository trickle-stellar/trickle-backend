import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as StellarSdk from '@stellar/stellar-sdk';
import { StreamService } from './stream.service';
import { Stream } from './entities/stream.entity';
import { StellarService } from '../stellar/stellar.service';
import { FactoryService } from '../factory/factory.service';

const STREAM_ADDRESS = 'CBTFOONYX6JY4ZY6FIF6T5MM4IQZSK6LMNKJZXYUKHBCBYDBKPUZ5RS7';
const SENDER = 'GAOZ3R4LREDF6VNCFI6NKZ4KNHLHIRH7N33FOUQD4OJJBC2VJ5QQBAMC';
const RECIPIENT = 'GD4DP66RE7FXSTHC2IZH3GJJM3Q46OOWV5EVCFDVWGFPC6HYWHHF77LV';
const ASSET = 'GAO2SN7MSNNCDUVIXSAF2OJRZY66W6FVP6KCGQTSIOAHLPGYFWUMQT4O';

const STREAM_INFO = {
  sender: SENDER,
  recipient: RECIPIENT,
  asset: ASSET,
  flow_rate: 123n,
  total_amount: 123000n,
  withdrawn_amount: 0n,
  start_time: 1700000000n,
  last_update_time: 1700000000n,
  status: [0],
};

describe('StreamService', () => {
  let service: StreamService;

  const mockStreamRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    upsert: jest.fn(),
  };

  const mockStellarService = {
    simulateContractCall: jest.fn(),
    prepareInvocationXdr: jest.fn(),
    submitTransaction: jest.fn(),
  };

  const mockFactoryService = {
    createStream: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StreamService,
        { provide: getRepositoryToken(Stream), useValue: mockStreamRepo },
        { provide: StellarService, useValue: mockStellarService },
        { provide: FactoryService, useValue: mockFactoryService },
      ],
    }).compile();

    service = module.get<StreamService>(StreamService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStreamInfo', () => {
    it('returns the cached DB row when present', async () => {
      const cached = { contractAddress: STREAM_ADDRESS, status: 'active' };
      mockStreamRepo.findOne.mockResolvedValue(cached);

      await expect(service.getStreamInfo(STREAM_ADDRESS)).resolves.toBe(cached);
      expect(mockStellarService.simulateContractCall).not.toHaveBeenCalled();
    });

    it('falls back to on-chain get_info and maps StreamInfo', async () => {
      mockStreamRepo.findOne.mockResolvedValue(null);
      mockStellarService.simulateContractCall.mockResolvedValue({
        status: 'succeeded',
        native: STREAM_INFO,
      } as any);

      const result = await service.getStreamInfo(STREAM_ADDRESS);

      expect(mockStellarService.simulateContractCall).toHaveBeenCalledWith(
        STREAM_ADDRESS,
        'get_info',
        [],
      );
      expect(result).toMatchObject({
        contractAddress: STREAM_ADDRESS,
        sender: SENDER,
        recipient: RECIPIENT,
        asset: ASSET,
        flowRate: '123',
        totalAmount: '123000',
        withdrawnAmount: '0',
        startTime: '1700000000',
        lastUpdateTime: '1700000000',
        status: 'active',
      });
      expect(result.streamId).toBeNull();
    });

    it('throws 404 when the stream has no info on-chain', async () => {
      mockStreamRepo.findOne.mockResolvedValue(null);
      mockStellarService.simulateContractCall.mockResolvedValue({
        status: 'rejected',
        code: 2,
        message: 'StreamNotFound',
      });

      await expect(service.getStreamInfo(STREAM_ADDRESS)).rejects.toMatchObject({
        status: 404,
        response: { message: 'StreamNotFound', code: 2 },
      });
    });
  });

  describe('getClaimableBalance', () => {
    it('returns the contract balance as a string', async () => {
      mockStellarService.simulateContractCall.mockResolvedValue({
        status: 'succeeded',
        native: 5500n,
      } as any);

      await expect(service.getClaimableBalance(STREAM_ADDRESS)).resolves.toEqual({
        claimable: '5500',
      });
    });

    it('throws 404 when the stream is not on-chain', async () => {
      mockStellarService.simulateContractCall.mockResolvedValue({
        status: 'rejected',
        code: 1,
        message: 'StreamNotInitialized',
      });

      await expect(service.getClaimableBalance(STREAM_ADDRESS)).rejects.toMatchObject({
        status: 404,
      });
    });
  });

  describe('getStreamsBySender / getStreamsByRecipient', () => {
    it('lists streams from the DB', async () => {
      mockStreamRepo.find.mockResolvedValue([]);
      await expect(service.getStreamsBySender(SENDER)).resolves.toEqual([]);
      expect(mockStreamRepo.find).toHaveBeenCalledWith({
        where: { sender: SENDER },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('createStream', () => {
    it('delegates to the factory service', async () => {
      mockFactoryService.createStream.mockResolvedValue({
        txXdr: 'AAAAxdr',
        factoryAddress: 'CFACTORY',
      });

      await expect(
        service.createStream(SENDER, RECIPIENT, ASSET, '1000', 86400),
      ).resolves.toEqual({ txXdr: 'AAAAxdr', factoryAddress: 'CFACTORY' });
      expect(mockFactoryService.createStream).toHaveBeenCalledWith(
        SENDER,
        RECIPIENT,
        ASSET,
        '1000',
        86400,
      );
    });

    it('propagates factory rejections', async () => {
      mockFactoryService.createStream.mockRejectedValue(
        new BadRequestException({ message: 'ZeroAmount', code: 1 }),
      );

      await expect(
        service.createStream(SENDER, RECIPIENT, ASSET, '0', 86400),
      ).rejects.toMatchObject({ status: 400 });
    });
  });

  describe('submit', () => {
    it('persists a created stream from on-chain get_info', async () => {
      mockStellarService.submitTransaction.mockResolvedValue({
        status: 'confirmed',
        hash: 'deadbeef',
        returnValue: StellarSdk.Address.fromString(STREAM_ADDRESS).toScVal(),
      });
      mockStellarService.simulateContractCall.mockResolvedValue({
        status: 'succeeded',
        native: STREAM_INFO,
      } as any);
      mockStreamRepo.upsert.mockResolvedValue({});

      const result = await service.submit('signed-xdr');

      expect(result).toEqual({
        status: 'confirmed',
        hash: 'deadbeef',
        streamAddress: STREAM_ADDRESS,
      });
      expect(mockStellarService.simulateContractCall).toHaveBeenCalledWith(
        STREAM_ADDRESS,
        'get_info',
        [],
      );
      expect(mockStreamRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          contractAddress: STREAM_ADDRESS,
          flowRate: '123',
          status: 'active',
        }),
        { conflictPaths: ['contractAddress'] },
      );
    });

    it('returns the decoded return value for non-create transactions', async () => {
      mockStellarService.submitTransaction.mockResolvedValue({
        status: 'confirmed',
        hash: 'abc123',
        returnValue: (() => {
          const parts = new StellarSdk.xdr.Int128Parts({
            lo: StellarSdk.xdr.Uint64.fromString('9000'),
            hi: StellarSdk.xdr.Int64.fromString('0'),
          });
          return StellarSdk.xdr.ScVal.scvI128(parts);
        })(),
      });

      const result = await service.submit('signed-xdr');

      expect(result).toEqual({ status: 'confirmed', hash: 'abc123', value: 9000n });
      expect(mockStreamRepo.upsert).not.toHaveBeenCalled();
    });

    it('throws 400 when the network rejected the transaction', async () => {
      mockStellarService.submitTransaction.mockResolvedValue({
        status: 'rejected',
        hash: 'bad',
        code: null,
        message: 'Transaction failed on the Stellar network',
      });

      await expect(service.submit('signed-xdr')).rejects.toMatchObject({
        status: 400,
        response: {
          message: 'Transaction failed on the Stellar network',
          code: null,
        },
      });
    });
  });

  describe('withdraw / pause / resume / cancel', () => {
    const cases = [
      { method: 'withdraw', caller: RECIPIENT, arg: RECIPIENT },
      { method: 'pause', caller: SENDER, arg: SENDER },
      { method: 'resume', caller: SENDER, arg: SENDER },
      { method: 'cancel', caller: SENDER, arg: SENDER },
    ];

    it.each(cases)(
      'prepares $method with $caller as the caller',
      async ({ method, caller, arg }) => {
        mockStellarService.prepareInvocationXdr.mockResolvedValue({
          ok: true,
          txXdr: `${method}-xdr`,
        });

        const result = await (
          service as unknown as Record<string, (a: string, b: string) => Promise<unknown>>
        )[method](STREAM_ADDRESS, arg);

        expect(result).toEqual({ txXdr: `${method}-xdr` });
        expect(mockStellarService.prepareInvocationXdr).toHaveBeenCalledWith(
          caller,
          STREAM_ADDRESS,
          method,
          expect.any(Array),
        );
        const args = mockStellarService.prepareInvocationXdr.mock.calls[0][3];
        expect(StellarSdk.scValToNative(args[0])).toBe(arg);
      },
    );

    it('maps a contract rejection to a 400', async () => {
      mockStellarService.prepareInvocationXdr.mockResolvedValue({
        ok: false,
        code: 1,
        message: 'NothingToWithdraw',
      });

      await expect(service.withdraw(STREAM_ADDRESS, RECIPIENT)).rejects.toMatchObject({
        status: 400,
        response: { message: 'NothingToWithdraw', code: 1 },
      });
    });
  });
});