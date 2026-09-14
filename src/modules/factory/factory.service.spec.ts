import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as StellarSdk from '@stellar/stellar-sdk';
import { FactoryService, FACTORY_NOT_CONFIGURED_MESSAGE } from './factory.service';
import { StellarService } from '../stellar/stellar.service';

const FACTORY_ADDRESS = 'CCME6JUVK3OQSHJCQ7KHZYMWRSQOIC2IJJ5S66Z7NAMUBM7L3OQ5M24E';
const SENDER = 'GDRCQ6OCTUTXRSLGB6XWOYYND7WSSUH5SG5J33SAFNQYAQGCIWYZPFJT';
const RECIPIENT = 'GA53IEOFWNYZ7AUCKTI6TWWNFIKYPPFLHEGK5ZNKFQ5IXDEPNINYBHGX';
const ASSET = 'GBE7AEUKR3ASL2JTEH2KXAJSAAGX24LF2QJLRRYSRRIDNGJGMS3ZOAYY';

describe('FactoryService', () => {
  let service: FactoryService;

  const mockStellarService = {
    prepareInvocationXdr: jest.fn(),
    simulateContractCall: jest.fn(),
  };

  const configure = (config: Record<string, unknown>) => ({
    get: jest.fn((key: string) => config[key]),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FactoryService,
        { provide: StellarService, useValue: mockStellarService },
        { provide: ConfigService, useValue: configure({}) },
      ],
    }).compile();

    service = module.get<FactoryService>(FactoryService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createStream', () => {
    it('throws 503 when factory address is not configured', async () => {
      await expect(
        service.createStream(SENDER, RECIPIENT, ASSET, '100', 86400),
      ).rejects.toThrow(new ServiceUnavailableException(FACTORY_NOT_CONFIGURED_MESSAGE));
    });

    it('rejects a non-positive amount', async () => {
      const module = await Test.createTestingModule({
        providers: [
          FactoryService,
          { provide: StellarService, useValue: mockStellarService },
          {
            provide: ConfigService,
            useValue: configure({ 'factory.contractAddress': FACTORY_ADDRESS }),
          },
        ],
      }).compile();
      const svc = module.get<FactoryService>(FactoryService);

      await expect(svc.createStream(SENDER, RECIPIENT, ASSET, '0', 86400)).rejects.toThrow(
        BadRequestException,
      );
      await expect(svc.createStream(SENDER, RECIPIENT, ASSET, '-5', 86400)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockStellarService.prepareInvocationXdr).not.toHaveBeenCalled();
    });

    it('rejects a non-positive duration', async () => {
      const module = await Test.createTestingModule({
        providers: [
          FactoryService,
          { provide: StellarService, useValue: mockStellarService },
          {
            provide: ConfigService,
            useValue: configure({ 'factory.contractAddress': FACTORY_ADDRESS }),
          },
        ],
      }).compile();
      const svc = module.get<FactoryService>(FactoryService);

      await expect(svc.createStream(SENDER, RECIPIENT, ASSET, '1', 0)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockStellarService.prepareInvocationXdr).not.toHaveBeenCalled();
    });

    it('prepares create_stream with correctly encoded args and returns the XDR', async () => {
      const module = await Test.createTestingModule({
        providers: [
          FactoryService,
          { provide: StellarService, useValue: mockStellarService },
          {
            provide: ConfigService,
            useValue: configure({ 'factory.contractAddress': FACTORY_ADDRESS }),
          },
        ],
      }).compile();
      const svc = module.get<FactoryService>(FactoryService);

      const sender = SENDER;
      const recipient = RECIPIENT;
      const asset = ASSET;

      mockStellarService.prepareInvocationXdr.mockResolvedValue({
        ok: true,
        txXdr: 'AAAAABFMDMQVdIrDtMN60eMYHZx+GFlJERdRDtvQHjBjxzSz',
      });

      const result = await svc.createStream(sender, recipient, asset, '1500000000', 604800);

      expect(mockStellarService.prepareInvocationXdr).toHaveBeenCalledWith(
        sender,
        FACTORY_ADDRESS,
        'create_stream',
        expect.any(Array),
      );
      const args = mockStellarService.prepareInvocationXdr.mock.calls[0][3];
      expect(args).toHaveLength(5);
      expect(StellarSdk.scValToNative(args[0])).toBe(sender);
      expect(StellarSdk.scValToNative(args[1])).toBe(recipient);
      expect(StellarSdk.scValToNative(args[2])).toBe(asset);
      expect(StellarSdk.scValToNative(args[3])).toBe(1500000000n);
      expect(StellarSdk.scValToNative(args[4])).toBe(604800);

      expect(result).toEqual({
        txXdr: 'AAAAABFMDMQVdIrDtMN60eMYHZx+GFlJERdRDtvQHjBjxzSz',
        factoryAddress: FACTORY_ADDRESS,
      });
    });

    it('maps a contract rejection during preparation to a 400', async () => {
      const module = await Test.createTestingModule({
        providers: [
          FactoryService,
          { provide: StellarService, useValue: mockStellarService },
          {
            provide: ConfigService,
            useValue: configure({ 'factory.contractAddress': FACTORY_ADDRESS }),
          },
        ],
      }).compile();
      const svc = module.get<FactoryService>(FactoryService);

      mockStellarService.prepareInvocationXdr.mockResolvedValue({
        ok: false,
        code: 1,
        message: 'ContractError(1)',
      });

      await expect(
        svc.createStream(SENDER, RECIPIENT, ASSET, '1', 86400),
      ).rejects.toMatchObject({
        status: 400,
        response: { message: 'ContractError(1)', code: 1 },
      });
    });
  });

  describe('getStream', () => {
    it('returns cached stream metadata on success', async () => {
      const module = await Test.createTestingModule({
        providers: [
          FactoryService,
          { provide: StellarService, useValue: mockStellarService },
          {
            provide: ConfigService,
            useValue: configure({ 'factory.contractAddress': FACTORY_ADDRESS }),
          },
        ],
      }).compile();
      const svc = module.get<FactoryService>(FactoryService);

      const streamInfo = { sender: 'GA', flow_rate: 100n };
      mockStellarService.simulateContractCall.mockResolvedValue({
        status: 'succeeded',
        native: streamInfo,
      } as any);

      await expect(svc.getStream(3)).resolves.toBe(streamInfo);
      expect(mockStellarService.simulateContractCall).toHaveBeenCalledWith(
        FACTORY_ADDRESS,
        'get_stream',
        expect.any(Array),
      );
      const args = mockStellarService.simulateContractCall.mock.calls[0][2];
      expect(StellarSdk.scValToNative(args[0])).toBe(3);
    });

    it('throws 404 when the factory reports stream not found', async () => {
      const module = await Test.createTestingModule({
        providers: [
          FactoryService,
          { provide: StellarService, useValue: mockStellarService },
          {
            provide: ConfigService,
            useValue: configure({ 'factory.contractAddress': FACTORY_ADDRESS }),
          },
        ],
      }).compile();
      const svc = module.get<FactoryService>(FactoryService);

      mockStellarService.simulateContractCall.mockResolvedValue({
        status: 'rejected',
        code: 2,
        message: 'StreamNotFound',
      });

      await expect(svc.getStream(99)).rejects.toMatchObject({
        status: 404,
        response: { message: 'StreamNotFound', code: 2 },
      });
    });
  });

  describe('getStreamsBySender / getStreamsByRecipient', () => {
    it('returns stream id lists from the factory registry', async () => {
      const module = await Test.createTestingModule({
        providers: [
          FactoryService,
          { provide: StellarService, useValue: mockStellarService },
          {
            provide: ConfigService,
            useValue: configure({ 'factory.contractAddress': FACTORY_ADDRESS }),
          },
        ],
      }).compile();
      const svc = module.get<FactoryService>(FactoryService);

      mockStellarService.simulateContractCall.mockResolvedValue({
        status: 'succeeded',
        native: [1, 5, 7],
      } as any);

      await expect(svc.getStreamsBySender(SENDER)).resolves.toEqual([1, 5, 7]);
      expect(mockStellarService.simulateContractCall).toHaveBeenCalledWith(
        FACTORY_ADDRESS,
        'get_streams_by_sender',
        expect.any(Array),
      );
      expect(StellarSdk.scValToNative(
        mockStellarService.simulateContractCall.mock.calls[0][2][0],
      )).toBe(SENDER);

      await expect(svc.getStreamsByRecipient(RECIPIENT)).resolves.toEqual([1, 5, 7]);
      expect(mockStellarService.simulateContractCall).toHaveBeenCalledWith(
        FACTORY_ADDRESS,
        'get_streams_by_recipient',
        expect.any(Array),
      );
    });

    it('maps a rejection to a 400', async () => {
      const module = await Test.createTestingModule({
        providers: [
          FactoryService,
          { provide: StellarService, useValue: mockStellarService },
          {
            provide: ConfigService,
            useValue: configure({ 'factory.contractAddress': FACTORY_ADDRESS }),
          },
        ],
      }).compile();
      const svc = module.get<FactoryService>(FactoryService);

      mockStellarService.simulateContractCall.mockResolvedValue({
        status: 'rejected',
        code: null,
        message: 'host error',
      });

      await expect(svc.getStreamsBySender(SENDER)).rejects.toMatchObject({ status: 400 });
    });
  });
});