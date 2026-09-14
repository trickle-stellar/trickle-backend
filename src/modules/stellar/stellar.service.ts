import { Injectable, Logger, OnModuleInit, Optional, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as StellarSdk from '@stellar/stellar-sdk';
import { symbolToScVal } from '../../common/soroban/scval';
import { StellarException } from './stellar.exception';

/**
 * Injection tokens so tests can substitute mocked RPC / Horizon clients
 * instead of constructing live network connections in `onModuleInit`.
 */
export const SOROBAN_RPC_CLIENT = Symbol('SOROBAN_RPC_CLIENT');
export const HORIZON_CLIENT = Symbol('HORIZON_CLIENT');

/** Placeholder ed25519 source used when simulating read-only calls that
 * carry no auth requirements (e.g. `get_balance`). */
export const SIMULATION_PLACEHOLDER_SOURCE =
  'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';

/** Successful contract invocation result. */
export interface SucceededContractCall {
  status: 'succeeded';
  value: StellarSdk.xdr.ScVal;
  native: unknown;
}

/** Contract-level rejection: the host *evaluated* the invocation and the
 * contract returned `Err(...)`. This is an expected, user-facing outcome
 * (e.g. "stream already initialized") — not an infrastructure failure. */
export interface RejectedContractCall {
  status: 'rejected';
  code: number | null;
  message: string;
}

export type ContractCallResult = SucceededContractCall | RejectedContractCall;

/** A transaction prepared server-side, ready for the client to sign. */
export type PreparedInvocation =
  | { ok: true; txXdr: string }
  | { ok: false; code: number | null; message: string };

export type SubmitTransactionResult =
  | { status: 'confirmed'; hash: string; returnValue?: StellarSdk.xdr.ScVal }
  | { status: 'rejected'; hash: string; code: number | null; message: string };

export interface GetEventsOptions {
  contractIds?: string[];
  startLedger?: number;
  cursor?: string;
  limit?: number;
}

export interface TrickleEvent {
  id: string;
  ledger: number;
  pagingToken: string;
  txHash: string;
  inSuccessfulContractCall: boolean;
  type: string;
  contractId?: string;
  topic: unknown[];
  value: unknown;
}

export interface EventsPage {
  latestLedger: number;
  cursor: string;
  events: TrickleEvent[];
}

/**
 * StellarService wraps all Horizon and Soroban RPC interactions.
 *
 * This is the ONLY module that talks to the Stellar network. All other
 * services inject StellarService for on-chain reads/writes.
 *
 * Failure model (important — upstream services branch on this):
 *   - Contract rejects the invocation (`Err(...)`)       → in-band `rejected`
 *     result. User-facing, expected (e.g. version of "not found" / "invalid").
 *   - Transport / JSON-RPC / envelope / account failures → thrown
 *     `StellarException`. Infrastructure error; 502 by default.
 */
@Injectable()
export class StellarService implements OnModuleInit {
  private readonly logger = new Logger(StellarService.name);

  private rpcClient?: StellarSdk.rpc.Server;
  private horizonClient?: StellarSdk.Horizon.Server;
  private networkPassphrase!: string;

  constructor(
    private readonly config: ConfigService,
    @Optional() @Inject(SOROBAN_RPC_CLIENT) injectedRpc?: StellarSdk.rpc.Server,
    @Optional() @Inject(HORIZON_CLIENT) injectedHorizon?: StellarSdk.Horizon.Server,
  ) {
    this.rpcClient = injectedRpc;
    this.horizonClient = injectedHorizon;
  }

  onModuleInit() {
    const horizonUrl = this.config.get<string>('stellar.horizonUrl');
    const sorobanRpcUrl = this.config.get<string>('stellar.sorobanRpcUrl');
    this.networkPassphrase = this.config.get<string>(
      'stellar.networkPassphrase',
    )!;

    this.rpcClient ??= new StellarSdk.rpc.Server(sorobanRpcUrl!);
    this.horizonClient ??= new StellarSdk.Horizon.Server(horizonUrl!);

    this.logger.log(
      `StellarService initialized (horizon: ${horizonUrl}, rpc: ${sorobanRpcUrl})`,
    );
  }

  /** Get the Soroban RPC server instance. */
  getSorobanRpc(): StellarSdk.rpc.Server {
    return this.rpcClient!;
  }

  /** Get the Horizon server instance. */
  getHorizonServer(): StellarSdk.Horizon.Server {
    return this.horizonClient!;
  }

  /** Get the network passphrase for the configured network. */
  getNetworkPassphrase(): string {
    return this.networkPassphrase!;
  }

  // ─── Contract Queries ────────────────────────────────────────────────────

  /**
   * Read a contract's persistent storage value by symbol key.
   *
   * Used to read config/state that the SDK simulation path can't easily
   * surface, e.g. `Config` storage keys. Returns the value decoded to a
   * native JS type (bigint values normalized to strings where i128/u64).
   */
  async getContractData(contractAddress: string, key: string): Promise<unknown> {
    try {
      const entry = await this.rpcClient!.getContractData(
        new StellarSdk.Contract(contractAddress),
        symbolToScVal(key),
        StellarSdk.rpc.Durability.Persistent,
      );
      return StellarSdk.scValToNative(entry.val.contractData().val());
    } catch (error) {
      throw this.toStellarException(error);
    }
  }

  /**
   * Simulate a read-only (or client-signable) contract invocation without
   * submitting it to the network.
   *
   * Failure model:
   *   - `rejected` result  → the host executed the invocation and the
   *     contract returned `Err(...)`. Expected, user-facing.
   *   - thrown StellarException → RPC/transport/envelope failure.
   *
   * @param contractAddress - The contract to call (C...)
   * @param method - The contract method name
   * @param args - Method arguments as ScVal
   * @param sourceAddress - Optional source account for the envelope; defaults
   *   to a non-authorizing placeholder (safe for read-only methods).
   */
  async simulateContractCall(
    contractAddress: string,
    method: string,
    args: StellarSdk.xdr.ScVal[] = [],
    sourceAddress?: string,
  ): Promise<ContractCallResult> {
    const tx = this.buildInvocationTransaction({
      sourceAddress: sourceAddress ?? SIMULATION_PLACEHOLDER_SOURCE,
      sourceSequence: '0',
      contractAddress,
      method,
      args,
    });

    let response;
    try {
      response = await this.rpcClient!.simulateTransaction(tx);
    } catch (error) {
      throw this.toStellarException(error);
    }

    if (StellarSdk.rpc.Api.isSimulationError(response)) {
      return { status: 'rejected', ...this.classifyHostError(response.error) };
    }

    const retval = response.result?.retval;
    return {
      status: 'succeeded',
      value: retval ?? StellarSdk.xdr.ScVal.scvVoid(),
      native: retval ? StellarSdk.scValToNative(retval) : undefined,
    };
  }

  // ─── Transaction Building & Submission ───────────────────────────────────

  /**
   * Build and prepare a state-changing contract invocation, returning an XDR
   * the client signs with Freighter and submits via {@link submitTransaction}.
   *
   * The transaction is server-side *prepared* (resource estimation + soroban
   * data via RPC) so the client only needs to sign, never estimate.
   *
   * The source account MUST exist on the configured network — its current
   * sequence is loaded from Horizon to build a valid envelope.
   *
   * @returns `{ ok: true, txXdr }` when prepared, or a `rejected` result when
   *   the host rejected the invocation during preparation.
   */
  async prepareInvocationXdr(
    sourceAddress: string,
    contractAddress: string,
    method: string,
    args: StellarSdk.xdr.ScVal[] = [],
  ): Promise<PreparedInvocation> {
    const sourceSequence = await this.getAccountSequence(sourceAddress);

    const tx = this.buildInvocationTransaction({
      sourceAddress,
      sourceSequence,
      contractAddress,
      method,
      args,
    });

    try {
      const prepared = await this.rpcClient!.prepareTransaction(tx);
      return { ok: true, txXdr: prepared.toXDR() };
    } catch (error) {
      // prepareTransaction throws Error(response.error) when the host
      // rejected the invocation — that is a contract-level result.
      const message = error instanceof Error ? error.message : '';
      if (message && this.isHostFailureText(message)) {
        return { ok: false, ...this.classifyHostError(message) };
      }
      throw this.toStellarException(error);
    }
  }

  /**
   * Submit a client-signed (base64 XDR) transaction and poll until it is
   * confirmed or rejected by the network.
   *
   * @returns
   *   - `confirmed` — the transaction succeeded; `returnValue` holds the
   *     contract's return value when present (e.g. a deployed stream address).
   *   - `rejected` — the network executed the transaction and it failed
   *     (contract error / txFailed). User-facing.
   * Throws `StellarException` for transport-level failures and if the
   * transaction is not finalized within the poll window.
   */
  async submitTransaction(signedXdr: string): Promise<SubmitTransactionResult> {
    let tx: StellarSdk.Transaction;
    try {
      tx = new StellarSdk.Transaction(signedXdr, this.networkPassphrase!);
    } catch (error) {
      throw this.toStellarException(error);
    }

    let response;
    try {
      response = await this.rpcClient!.sendTransaction(tx);
    } catch (error) {
      throw this.toStellarException(error);
    }

    if (response.status === 'ERROR') {
      return this.rejectionResult(
        response.hash,
        'Transaction rejected by the network',
      );
    }

    const status = await this.pollTransaction(response.hash);
    if (status.status === StellarSdk.rpc.Api.GetTransactionStatus.SUCCESS) {
      return { status: 'confirmed', hash: response.hash, returnValue: status.returnValue };
    }
    return this.rejectionResult(
      response.hash,
      'Transaction failed on the Stellar network',
    );
  }

  // ─── Event Streaming ─────────────────────────────────────────────────────

  /**
   * Fetch contract events via Soroban RPC, paged by cursor.
   *
   * Returns normalized event objects (topics and values decoded to native
   * types) plus the next `cursor` for resumable polling. The indexer module
   * drives the polling loop; this method is the stateless page-fetching core.
   */
  async getEvents(options: GetEventsOptions = {}): Promise<EventsPage> {
    const { contractIds, startLedger, cursor, limit } = options;

    let response;
    try {
      response = await this.rpcClient!.getEvents({
        filters: [
          {
            type: 'contract',
            ...(contractIds ? { contractIds } : {}),
          },
        ],
        ...(startLedger !== undefined ? { startLedger } : {}),
        ...(cursor ? { cursor } : {}),
        ...(limit !== undefined ? { limit } : {}),
      });
    } catch (error) {
      throw this.toStellarException(error);
    }

    return {
      latestLedger: response.latestLedger,
      cursor: response.cursor,
      events: response.events.map((event) => this.normalizeEvent(event)),
    };
  }

  // ─── Account Helpers ─────────────────────────────────────────────────────

  /** Get the current sequence number for an account (for building txs). */
  async getAccountSequence(address: string): Promise<string> {
    try {
      const account = await this.horizonClient!.loadAccount(address);
      return account.sequence;
    } catch (error) {
      throw this.toStellarException(error);
    }
  }

  /** Current latest ledger sequence. */
  async getLatestLedger(): Promise<number> {
    try {
      return (await this.rpcClient!.getLatestLedger()).sequence;
    } catch (error) {
      throw this.toStellarException(error);
    }
  }

  // ─── Internals ───────────────────────────────────────────────────────────

  private buildInvocationTransaction(parts: {
    sourceAddress: string;
    sourceSequence: string;
    contractAddress: string;
    method: string;
    args: StellarSdk.xdr.ScVal[];
  }): StellarSdk.Transaction {
    const account = new StellarSdk.Account(parts.sourceAddress, parts.sourceSequence);
    const contract = new StellarSdk.Contract(parts.contractAddress);

    return new StellarSdk.TransactionBuilder(account, {
      fee: this.config.get<string>('stellar.baseFee') ?? '100',
      networkPassphrase: this.networkPassphrase!,
    })
      .addOperation(contract.call(parts.method, ...parts.args))
      .setTimeout(StellarSdk.TimeoutInfinite)
      .build();
  }

  private async pollTransaction(
    hash: string,
  ): Promise<
    | { status: StellarSdk.rpc.Api.GetTransactionStatus.SUCCESS; returnValue?: StellarSdk.xdr.ScVal }
    | { status: StellarSdk.rpc.Api.GetTransactionStatus.FAILED }
  > {
    const maxAttempts = 15;
    const pollIntervalMs = 1000;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      let status;
      try {
        status = await this.rpcClient!.getTransaction(hash);
      } catch (error) {
        throw this.toStellarException(error);
      }

      if (status.status === StellarSdk.rpc.Api.GetTransactionStatus.SUCCESS) {
        return { status: status.status, returnValue: status.returnValue };
      }
      if (status.status === StellarSdk.rpc.Api.GetTransactionStatus.FAILED) {
        return { status: status.status };
      }
      await this.sleep(pollIntervalMs);
    }

    throw new StellarException(
      `Transaction ${hash} not finalized within ${(maxAttempts * pollIntervalMs) / 1000}s`,
    );
  }

  private rejectionResult(
    hash: string,
    message: string,
  ): SubmitTransactionResult {
    return {
      status: 'rejected',
      hash,
      message,
      code: null,
    };
  }

  private normalizeEvent(event: StellarSdk.rpc.Api.EventResponse): TrickleEvent {
    return {
      id: event.id,
      ledger: event.ledger,
      pagingToken: event.pagingToken,
      txHash: event.txHash,
      inSuccessfulContractCall: event.inSuccessfulContractCall,
      type: event.type,
      contractId: event.contractId?.toString(),
      topic: event.topic.map((scv) => StellarSdk.scValToNative(scv)),
      value: StellarSdk.scValToNative(event.value),
    };
  }

  /**
   * Best-effort numeric contract-error extraction from host diagnostic text
   * (simulation path). Reliable `code` decoding on the *submission* path
   * needs the contract's error-type map (follow-up feature), so rejected
   * submissions surface `code: null` via {@link rejectionResult}.
   */
  private classifyHostError(errorText: string): {
    code: number | null;
    message: string;
  } {
    const match =
      /(?:ContractError|ScError|error: Contract|code:)\s*\(?(\d+)\)?/i.exec(
        errorText,
      );
    return {
      code: match ? parseInt(match[1], 10) : null,
      message: errorText
        .split(/[\r\n]+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 4)
        .join(' '),
    };
  }

  private isHostFailureText(message: string): boolean {
    return /(?:HostError|ContractError|ScError|contract error|code:)/i.test(
      message,
    );
  }

  private toStellarException(error: unknown): StellarException {
    if (error instanceof StellarException) return error;

    const anyError = error as {
      response?: {
        data?: {
          extras?: { result_codes?: { transaction?: unknown } };
          error?: unknown;
        };
      };
      message?: string;
    };

    const message =
      (anyError?.response?.data?.extras?.result_codes?.transaction as string) ||
      (anyError?.response?.data?.error as string) ||
      anyError?.message ||
      'Stellar network error';
    const details = anyError?.response?.data ?? null;

    return new StellarException(message, details);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}