#!/usr/bin/env ts-node
/**
 * Deploys the Trickle factory contract and its stream wasm.
 *
 * Uses the `stellar` CLI (installed separately: `npm i -g @stellar/stellar-cli`).
 * Run with environment, e.g.:
 *
 *   DEPLOY_SOURCE=S... \
 *   FACTORY_ADMIN=G... \
 *   STREAM_WASM_PATH=../trickle-contracts/target/wasm32-unknown-unknown/release/trickle_stream.wasm \
 *   pnpm deploy
 *
 * Prints FACTORY_CONTRACT_ADDRESS and STREAM_WASM_HASH to set in the backend.
 */
import { execFileSync } from 'node:child_process';
import * as dotenv from 'dotenv';

dotenv.config();

const env = (name: string, fallback?: string): string => {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
};

const RPC_URL = env('STELLAR_RPC_URL', 'https://soroban-rpc.testnet.stellar.org');
const NETWORK_PASSPHRASE = env(
  'STELLAR_NETWORK_PASSPHRASE',
  'Test SDF Network ; September 2015',
);
const SOURCE = env('DEPLOY_SOURCE');
const ADMIN = env('FACTORY_ADMIN');
const WASM_PATH = env('STREAM_WASM_PATH');

function run(args: string[]): string {
  return execFileSync('stellar', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function networkFlags(): string[] {
  return ['--rpc-url', RPC_URL, '--network-passphrase', NETWORK_PASSPHRASE];
}

function extractField(stdout: string, field: string): string {
  try {
    const json = JSON.parse(stdout.trim());
    if (json[field]) return String(json[field]);
  } catch {
    // non-JSON output; fall through to regex
  }
  const match = stdout.match(/[0-9a-fA-F]{50,}|C[A-Z2-7]{55}/);
  if (!match) throw new Error(`Could not parse ${field} from CLI output: ${stdout}`);
  return match[0];
}

function main() {
  console.log('Uploading stream wasm...');
  const uploadOut = run([
    'contract',
    'upload',
    '--source',
    SOURCE,
    ...networkFlags(),
    '--wasm',
    WASM_PATH,
    '--json',
  ]);
  const wasmHash = extractField(uploadOut, 'hash');

  console.log('Deploying factory contract...');
  const deployOut = run([
    'contract',
    'deploy',
    '--source',
    SOURCE,
    ...networkFlags(),
    '--wasm-hash',
    wasmHash,
    '--json',
  ]);
  const factoryAddress = extractField(deployOut, 'contractId');

  console.log('Initializing factory...');
  run([
    'contract',
    'invoke',
    '--source',
    SOURCE,
    ...networkFlags(),
    '--id',
    factoryAddress,
    '--',
    'initialize',
    '--admin',
    ADMIN,
    '--stream_wasm_hash',
    wasmHash,
  ]);

  console.log('FACTORY_CONTRACT_ADDRESS=' + factoryAddress);
  console.log('STREAM_WASM_HASH=' + wasmHash);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}