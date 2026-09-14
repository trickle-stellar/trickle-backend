import {
  Address,
  xdr,
} from '@stellar/stellar-sdk';

const I128_BITS = 128n;
const U128_MASK = (1n << I128_BITS) - 1n;
const U64_MASK = (1n << 64n) - 1n;

/**
 * Encode a signed 128-bit integer as an `ScVal`.
 *
 * Accepts decimal strings (the canonical form for i128 token amounts),
 * bigints, or numbers. Negative values are wrapped in two's complement.
 *
 * The Soroban contracts use `i128` for all token amounts, and amount XDR
 * lengths differ from native JS numbers — always pass amounts as strings.
 */
export function i128ToScVal(value: string | bigint | number): xdr.ScVal {
  let bigInt = typeof value === 'bigint' ? value : BigInt(value);
  bigInt &= U128_MASK;

  const lo = bigInt & U64_MASK;
  let hi = bigInt >> 64n;
  if (hi >= 1n << 63n) {
    hi -= 1n << 64n; // signed i64 host value
  }

  return xdr.ScVal.scvI128(
    new xdr.Int128Parts({
      lo: xdr.Uint64.fromString(lo.toString()),
      hi: xdr.Int64.fromString(hi.toString()),
    }),
  );
}

/**
 * Encode an unsigned 32-bit integer (e.g. stream durations in seconds, u32
 * stream ids) as an `ScVal`.
 */
export function u32ToScVal(value: number): xdr.ScVal {
  return xdr.ScVal.scvU32(value);
}

/**
 * Encode an unsigned 64-bit integer (e.g. `u64` ledger timestamps) as an
 * `ScVal`.
 */
export function u64ToScVal(value: string | bigint | number): xdr.ScVal {
  return xdr.ScVal.scvU64(
    xdr.Uint64.fromString(typeof value === 'bigint' ? value.toString() : value.toString()),
  );
}

/**
 * Encode a Stellar address (`G...` or `C...`) as an `ScVal` address value.
 * Used for `Address` arguments in contract invocations.
 */
export function addressToScVal(strkey: string): xdr.ScVal {
  return Address.fromString(strkey).toScVal();
}

/**
 * Encode a storage key symbol (e.g. `"Config"`) as an `ScVal` symbol.
 * Matches the symbol-based storage keys used by the Trickle contracts.
 */
export function symbolToScVal(key: string): xdr.ScVal {
  return xdr.ScVal.scvSymbol(key);
}