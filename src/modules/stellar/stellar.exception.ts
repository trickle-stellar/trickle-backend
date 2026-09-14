import {
  HttpException,
  HttpStatus,
} from '@nestjs/common';

/**
 * Raised when an interaction with the Stellar network fails at the
 * transport / RPC / XDR layer — e.g. the RPC endpoint is unreachable, a
 * JSON-RPC method errors, an envelope cannot be built or parsed, or Horizon
 * rejects an account lookup.
 *
 * This is deliberately distinct from *contract-level* rejections. A contract
 * returning `Err(...)` (e.g. a stream already initialized) is an *expected*
 * user-facing outcome and is returned in-band by `simulateContractCall` /
 * `submitTransaction` as a rejected result — it is never thrown as this
 * exception. Upstream services must branch on the two failure modes
 * differently (user-facing vs infrastructure error).
 */
export class StellarException extends HttpException {
  constructor(message: string, details?: unknown) {
    super(
      {
        statusCode: HttpStatus.BAD_GATEWAY,
        message,
        details: details ?? null,
      },
      HttpStatus.BAD_GATEWAY,
    );
    this.name = 'StellarException';
  }
}