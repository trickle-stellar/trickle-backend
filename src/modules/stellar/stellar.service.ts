import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as StellarSdk from '@stellar/stellar-sdk';

/**
 * StellarService wraps all Horizon and Soroban RPC interactions.
 *
 * This is the ONLY module that talks to the Stellar network.
 * All other services inject StellarService for on-chain reads/writes.
 *
 * Architecture:
 *   Controller → Service → StellarService → Horizon / Soroban RPC
 *
 * Key distinction:
 *   - Horizon API: account queries, transaction history, ledger info
 *   - Soroban RPC: contract invocations, state reads, simulation
 */
@Injectable()
export class StellarService implements OnModuleInit {
  private readonly logger = new Logger(StellarService.name);
  private server!: StellarSdk.Horizon.Server;
  private sorobanRpc!: StellarSdk.rpc.Server;
  private networkPassphrase!: string;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const horizonUrl = this.config.get<string>('stellar.horizonUrl');
    const sorobanRpcUrl = this.config.get<string>('stellar.sorobanRpcUrl');
    this.networkPassphrase = this.config.get<string>(
      'stellar.networkPassphrase',
    )!;

    this.server = new StellarSdk.Horizon.Server(horizonUrl!);
    this.sorobanRpc = new StellarSdk.rpc.Server(sorobanRpcUrl!);

    this.logger.log(
      `StellarService initialized (horizon: ${horizonUrl}, rpc: ${sorobanRpcUrl})`,
    );
  }

  /**
   * Get the Soroban RPC server instance.
   * Use this for contract invocations and state reads.
   */
  getSorobanRpc(): StellarSdk.rpc.Server {
    return this.sorobanRpc;
  }

  /**
   * Get the Horizon server instance.
   * Use this for account queries and transaction history.
   */
  getHorizonServer(): StellarSdk.Horizon.Server {
    return this.server;
  }

  /**
   * Get the network passphrase for the configured network.
   */
  getNetworkPassphrase(): string {
    return this.networkPassphrase;
  }

  // ─── Contract Queries ────────────────────────────────────────────────────

  /**
   * Read a contract's persistent storage value.
   *
   * TODO: Implement using Soroban RPC getContractData().
   *
   * This will be used by services to read on-chain state like:
   *   - Stream config (sender, recipient, flow_rate, etc.)
   *   - Vesting schedule (beneficiary, total_amount, cliff, etc.)
   *   - Fee rate configuration
   *
   * @param contractAddress - The Soroban contract address (C...)
   * @param key - The storage key (usually a symbol like "Config")
   * @returns The decoded contract data value
   */
  async getContractData(contractAddress: string, key: string): Promise<any> {
    this.logger.debug(`getContractData(${contractAddress}, ${key})`);

    // TODO: Implement
    //   const contract = new StellarSdk.Contract(contractAddress);
    //   const result = await this.sorobanRpc.getContractData(
    //     contract,
    //     key,
    //     StellarSdk.SorobanRpc.rpc.DataLast,
    //   );
    //   return this.decodeScVal(result.xdr);

    throw new Error(
      'StellarService.getContractData() not implemented — see TODO comments',
    );
  }

  /**
   * Simulate a contract invocation without submitting a transaction.
   *
   * TODO: Implement using Soroban rpc.simulateTransaction().
   *
   * Used for read-only contract calls like:
   *   - stream.get_balance()
   *   - stream.get_info()
   *   - factory.get_stream(id)
   *   - fees.calculate_fee(amount)
   *
   * @param contractAddress - The contract to call
   * @param method - The contract method name
   * @param args - Method arguments (ScVal[])
   * @returns The simulation result
   */
  async simulateContractCall(
    contractAddress: string,
    method: string,
    args: any[] = [],
  ): Promise<any> {
    this.logger.debug(
      `simulateContractCall(${contractAddress}, ${method})`,
    );

    // TODO: Implement
    //   const contract = new StellarSdk.Contract(contractAddress);
    //   const txBuilder = new StellarSdk.TransactionBuilder(sourceAccount, {
    //     fee: StellarSdk.BASE_FEE,
    //     networkPassphrase: this.networkPassphrase,
    //   });
    //   const tx = txBuilder
    //     .addOperation(contract.call(method, ...args))
    //     .setTimeout(StellarSdk.TimeoutInfinite)
    //     .build();
    //   const result = await this.sorobanRpc.simulateTransaction(tx);
    //   return this.decodeSimulationResult(result);

    throw new Error(
      'StellarService.simulateContractCall() not implemented — see TODO comments',
    );
  }

  // ─── Transaction Submission ──────────────────────────────────────────────

  /**
   * Submit a signed transaction to the Stellar network.
   *
   * TODO: Implement using Horizon server submitTransaction().
   *
   * Flow:
   *   1. Client builds and signs a transaction XDR (via Freighter or SDK)
   *   2. Client sends the signed XDR to our backend
   *   3. Backend submits via this method
   *   4. Backend waits for confirmation
   *   5. Backend returns the result
   *
   * @param signedXdr - The base64-encoded signed transaction XDR
   * @returns The transaction result
   */
  async submitTransaction(signedXdr: string): Promise<any> {
    this.logger.debug('submitTransaction()');

    // TODO: Implement
    //   const tx = new StellarSdk.Transaction(signedXdr, this.networkPassphrase);
    //   const result = await this.server.submitTransaction(tx);
    //   return result;

    throw new Error(
      'StellarService.submitTransaction() not implemented — see TODO comments',
    );
  }

  // ─── Event Streaming ─────────────────────────────────────────────────────

  /**
   * Watch for contract events via Horizon.
   *
   * TODO: Implement using Horizon server transactions().stream() or
   *   Soroban Rpc using SorobanRpc.Server.getEvents().
   *
   * Used by the indexer module to:
   *   - Listen for stream_created, stream_withdrawn, stream_paused events
   *   - Listen for vesting_initialized, vesting_claimed events
   *   - Listen for multistream events
   *   - Store events in Postgres for fast queries
   *
   * @param contractAddress - The contract to watch
   * @param cursor - The event cursor to start from (for resumption)
   * @param callback - Called for each new event
   */
  async watchEvents(
    contractAddress: string,
    cursor: string,
    callback: (event: any) => void,
  ): Promise<void> {
    this.logger.debug(`watchEvents(${contractAddress}, cursor: ${cursor})`);

    // TODO: Implement using Soroban RPC getEvents()
    //   const events = await this.sorobanRpc.getEvents({
    //     startLedger: parseInt(cursor),
    //     filters: [{
    //       type: 'contract',
    //       contractIds: [contractAddress],
    //     }],
    //   });
    //   for (const event of events.events) {
    //     callback(this.parseEvent(event));
    //   }

    throw new Error(
      'StellarService.watchEvents() not implemented — see TODO comments',
    );
  }

  // ─── Account Helpers ─────────────────────────────────────────────────────

  /**
   * Get the current sequence number for an account.
   * Needed for building transactions.
   *
   * TODO: Implement using Horizon server loadAccount().
   */
  async getAccountSequence(address: string): Promise<string> {
    this.logger.debug(`getAccountSequence(${address})`);

    // TODO: Implement
    //   const account = await this.server.loadAccount(address);
    //   return account.sequence;

    throw new Error(
      'StellarService.getAccountSequence() not implemented — see TODO comments',
    );
  }
}
