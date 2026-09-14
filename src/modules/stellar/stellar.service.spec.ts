import * as StellarSdk from '@stellar/stellar-sdk';
import { ConfigService } from '@nestjs/config';
import { HttpStatus } from '@nestjs/common';
import {
  StellarService,
  SIMULATION_PLACEHOLDER_SOURCE,
} from './stellar.service';
import { StellarException } from './stellar.exception';
import { i128ToScVal, symbolToScVal } from '../../common/soroban/scval';

const VALID_G = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
const VALID_C = StellarSdk.StrKey.encodeContract(Buffer.alloc(32, 7));
const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';

function makeValidSignedXdr(): string {
  const account = new StellarSdk.Account(VALID_G, '1');
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: '100',
    networkPassphrase: TESTNET_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: VALID_G,
        asset: StellarSdk.Asset.native(),
        amount: '1',
      }),
    )
    .setTimeout(0)
    .build();

  return tx.toXDR();
}

function makeConfigMock(overrides: Record<string, string> = {}) {
  const values: Record<string, string> = {
    'stellar.horizonUrl': 'https://horizon-testnet.stellar.org',
    'stellar.sorobanRpcUrl': 'https://soroban-testnet.stellar.org',
    'stellar.networkPassphrase': 'Test SDF Network ; September 2015',
    'stellar.baseFee': '100',
    ...overrides,
  };
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

type MockRpc = {
  getContractData: jest.Mock;
  simulateTransaction: jest.Mock;
  prepareTransaction: jest.Mock;
  sendTransaction: jest.Mock;
  getTransaction: jest.Mock;
  getEvents: jest.Mock;
  getLatestLedger: jest.Mock;
};

type MockHorizon = {
  loadAccount: jest.Mock;
};

function makeMockRpc(): MockRpc {
  return {
    getContractData: jest.fn(),
    simulateTransaction: jest.fn(),
    prepareTransaction: jest.fn(),
    sendTransaction: jest.fn(),
    getTransaction: jest.fn(),
    getEvents: jest.fn(),
    getLatestLedger: jest.fn(),
  };
}

function makeMockHorizon(): MockHorizon {
  return {
    loadAccount: jest.fn(),
  };
}

function makeContractDataEntry(val: StellarSdk.xdr.ScVal): StellarSdk.xdr.LedgerEntryData {
  const ext = new (StellarSdk.xdr.ExtensionPoint as any)(0);
  const entry = new StellarSdk.xdr.ContractDataEntry({
    ext,
    contract: StellarSdk.xdr.ScAddress.scAddressTypeContract(
      Buffer.alloc(20, 7),
    ),
    key: symbolToScVal('Config'),
    durability: StellarSdk.xdr.ContractDataDurability.persistent(),
    val,
  } as any);
  return StellarSdk.xdr.LedgerEntryData.contractData(entry);
}

describe('StellarService', () => {
  let service: StellarService;
  let mockRpc: MockRpc;
  let mockHorizon: MockHorizon;
  let configMock: ConfigService;

  beforeEach(() => {
    configMock = makeConfigMock();
    mockRpc = makeMockRpc();
    mockHorizon = makeMockHorizon();
    service = new StellarService(
      configMock,
      mockRpc as unknown as StellarSdk.rpc.Server,
      mockHorizon as unknown as StellarSdk.Horizon.Server,
    );
    service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getNetworkPassphrase should return the configured passphrase', () => {
    expect(service.getNetworkPassphrase()).toBe(
      'Test SDF Network ; September 2015',
    );
  });

  describe('getContractData', () => {
    it('should decode the stored value from a contract data entry', async () => {
      mockRpc.getContractData.mockResolvedValue({
        val: makeContractDataEntry(i128ToScVal('500')),
      });

      const result = await service.getContractData(VALID_C, 'Config');

      expect(result).toBe(500n);
      expect(mockRpc.getContractData).toHaveBeenCalledWith(
        expect.any(StellarSdk.Contract),
        symbolToScVal('Config'),
        StellarSdk.rpc.Durability.Persistent,
      );
    });

    it('should wrap network failures as StellarException', async () => {
      mockRpc.getContractData.mockRejectedValue(
        new Error('JSON-RPC: connection refused'),
      );

      await expect(service.getContractData(VALID_C, 'Config')).rejects.toBeInstanceOf(
        StellarException,
      );
    });
  });

  describe('simulateContractCall', () => {
    it('should return the decoded return value on success', async () => {
      mockRpc.simulateTransaction.mockResolvedValue({
        result: { retval: i128ToScVal('1234') },
        _parsed: true,
      } as unknown as StellarSdk.rpc.Api.SimulateTransactionSuccessResponse);

      const result = await service.simulateContractCall(VALID_C, 'get_balance');

      expect(result).toMatchObject({ status: 'succeeded' });
      if (result.status === 'succeeded') {
        expect(result.native).toBe(1234n);
      }
    });

    it('should report a rejected (contract-level) result with a decoded code', async () => {
      mockRpc.simulateTransaction.mockResolvedValue({
        error:
          'HostError: invoke host function failed\nContractError(11)\nmore details',
        events: [],
        _parsed: true,
      } as unknown as StellarSdk.rpc.Api.SimulateTransactionErrorResponse);

      const result = await service.simulateContractCall(VALID_C, 'pause');

      expect(result.status).toBe('rejected');
      if (result.status === 'rejected') {
        expect(result.code).toBe(11);
        expect(result.message).toContain('ContractError(11)');
      }
    });

    it('should throw StellarException for transport failures (not rejected)', async () => {
      mockRpc.simulateTransaction.mockRejectedValue(
        new Error('connect ECONNREFUSED 1.2.3.4'),
      );

      await expect(
        service.simulateContractCall(VALID_C, 'get_balance'),
      ).rejects.toThrow(StellarException);
    });

    it('should use the placeholder source when none is given', async () => {
      mockRpc.simulateTransaction.mockResolvedValue({
        result: { retval: i128ToScVal('1') },
        _parsed: true,
      } as unknown as StellarSdk.rpc.Api.SimulateTransactionSuccessResponse);

      await service.simulateContractCall(VALID_C, 'get_balance');

      const tx = mockRpc.simulateTransaction.mock.calls[0][0] as StellarSdk.Transaction;
      expect(tx.source).toBe(SIMULATION_PLACEHOLDER_SOURCE);
    });
  });

  describe('prepareInvocationXdr', () => {
    it('should load the real sequence and return a prepared XDR', async () => {
      mockHorizon.loadAccount.mockResolvedValue({ sequence: '42' });
      mockRpc.prepareTransaction.mockResolvedValue({
        toXDR: () => 'AAAAAFgAAAAA...',
      });

      const result = await service.prepareInvocationXdr(
        VALID_G,
        VALID_C,
        'withdraw',
        [],
      );

      expect(mockHorizon.loadAccount).toHaveBeenCalledWith(VALID_G);
      expect(result).toEqual({ ok: true, txXdr: 'AAAAAFgAAAAA...' });
    });

    it('should return a rejected result when preparation hits a host error', async () => {
      mockHorizon.loadAccount.mockResolvedValue({ sequence: '42' });
      mockRpc.prepareTransaction.mockRejectedValue(
        new Error('HostError: contract error (code: 7)'),
      );

      const result = await service.prepareInvocationXdr(
        VALID_G,
        VALID_C,
        'withdraw',
        [],
      );

      expect(result).toEqual({ ok: false, code: 7, message: expect.any(String) });
    });

    it('should throw StellarException for non-host preparation failures', async () => {
      mockHorizon.loadAccount.mockResolvedValue({ sequence: '42' });
      mockRpc.prepareTransaction.mockRejectedValue(
        new Error('No account created in transaction'),
      );

      await expect(
        service.prepareInvocationXdr(VALID_G, VALID_C, 'withdraw', []),
      ).rejects.toThrow(StellarException);
    });
  });

  describe('submitTransaction', () => {
    it('should confirm and surface the contract return value', async () => {
      mockRpc.sendTransaction.mockResolvedValue({
        status: 'PENDING',
        hash: 'abc123',
        latestLedger: 1,
        latestLedgerCloseTime: 0,
      });
      mockRpc.getTransaction.mockResolvedValue({
        status: StellarSdk.rpc.Api.GetTransactionStatus.SUCCESS,
        returnValue: symbolToScVal('ok'),
      });

      const result = await service.submitTransaction(makeValidSignedXdr());

      expect(result.status).toBe('confirmed');
      if (result.status === 'confirmed' && result.returnValue) {
        expect(result.hash).toBe('abc123');
        expect(StellarSdk.scValToNative(result.returnValue)).toBe('ok');
      }
    });

    it('should report a rejected result when the network fails the tx', async () => {
      mockRpc.sendTransaction.mockResolvedValue({
        status: 'ERROR',
        hash: 'abc123',
        latestLedger: 1,
        latestLedgerCloseTime: 0,
      });

      const result = await service.submitTransaction(makeValidSignedXdr());

      expect(result.status).toBe('rejected');
    });

    it('should throw StellarException for transport failures', async () => {
      mockRpc.sendTransaction.mockRejectedValue(
        new Error('socket hang up'),
      );

      await expect(
        service.submitTransaction(makeValidSignedXdr()),
      ).rejects.toThrow(StellarException);
    });

    it('should throw StellarException while parsing a malformed XDR', async () => {
      await expect(
        service.submitTransaction('not-valid-base64-xdr'),
      ).rejects.toThrow(StellarException);
    });
  });

  describe('getEvents', () => {
    it('should normalize and return events with the resume cursor', async () => {
      mockRpc.getEvents.mockResolvedValue({
        latestLedger: 500,
        cursor: 'cursor-next',
        events: [
          {
            id: 'evt-1',
            ledger: 499,
            pagingToken: 'pt-1',
            txHash: 'tx-1',
            inSuccessfulContractCall: true,
            type: 'contract',
            contractId: new StellarSdk.Contract(VALID_C),
            topic: [symbolToScVal('withdrawn')],
            value: i128ToScVal('9'),
          },
        ],
      });

      const page = await service.getEvents({ contractIds: [VALID_C], cursor: 'cursor-next' });

      expect(page.latestLedger).toBe(500);
      expect(page.cursor).toBe('cursor-next');
      expect(page.events).toHaveLength(1);
      expect(page.events[0]).toMatchObject({
        contractId: VALID_C,
        topic: ['withdrawn'],
      });
      expect(page.events[0].value).toBe(9n);
    });
  });

  describe('getAccountSequence', () => {
    it('should return the Horizon sequence string', async () => {
      mockHorizon.loadAccount.mockResolvedValue({ sequence: '42' });

      await expect(service.getAccountSequence(VALID_G)).resolves.toBe('42');
    });

    it('should wrap Horizon failures as StellarException', async () => {
      mockHorizon.loadAccount.mockRejectedValue({ name: 'NotFoundError' });

      const error = await service
        .getAccountSequence(VALID_G)
        .then(() => null, (e) => e);
      expect(error).toBeInstanceOf(StellarException);
      expect(error).toMatchObject({
        status: HttpStatus.BAD_GATEWAY,
      });
    });
  });
});