import * as StellarSdk from '@stellar/stellar-sdk';
import {
  addressToScVal,
  i128ToScVal,
  u32ToScVal,
  u64ToScVal,
  symbolToScVal,
} from './scval';

const VALID_G = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';

describe('scval helpers', () => {
  describe('i128ToScVal', () => {
    it('should encode a positive amount from a decimal string', () => {
      const native = StellarSdk.scValToNative(i128ToScVal('1000000'));
      expect(native).toBe(1000000n);
    });

    it('should encode a bigint amount', () => {
      const native = StellarSdk.scValToNative(i128ToScVal(10n ** 18n));
      expect(native).toBe(10n ** 18n);
    });

    it('should encode a negative amount via two\'s complement', () => {
      const native = StellarSdk.scValToNative(i128ToScVal('-5'));
      expect(native).toBe(-5n);
    });

    it('should handle amounts larger than a u64 span', () => {
      const big = 10n ** 30n;
      expect(StellarSdk.scValToNative(i128ToScVal(big.toString()))).toBe(big);
    });

    it('should wrap values beyond signed i128 range in two\'s complement', () => {
      const overflow = (1n << 127n) | 63n;
      const native = StellarSdk.scValToNative(i128ToScVal(overflow.toString()));
      expect(native).toBe(-(1n << 127n) + 63n);
    });
  });

  describe('u32ToScVal', () => {
    it('should encode a u32 duration', () => {
      expect(StellarSdk.scValToNative(u32ToScVal(86400))).toBe(86400);
    });
  });

  describe('u64ToScVal', () => {
    it('should encode a u64 timestamp from a string', () => {
      expect(StellarSdk.scValToNative(u64ToScVal('1234567890123'))).toBe(
        1234567890123n,
      );
    });
  });

  describe('addressToScVal', () => {
    it('should encode a G address and round-trip', () => {
      const scv = addressToScVal(VALID_G);
      expect(scv.switch().name).toBe('scvAddress');
      expect(StellarSdk.scValToNative(scv)).toBe(VALID_G);
    });

    it('should reject malformed addresses', () => {
      expect(() => addressToScVal('not-an-address')).toThrow();
    });
  });

  describe('symbolToScVal', () => {
    it('should encode a symbol key', () => {
      expect(StellarSdk.scValToNative(symbolToScVal('Config'))).toBe('Config');
    });
  });
});