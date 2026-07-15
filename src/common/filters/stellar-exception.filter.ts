import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Catches errors originating from Stellar SDK / Horizon / Soroban RPC calls.
 *
 * Stellar errors typically come as:
 * - axios HTTP errors from Horizon (400/404/500 with result_codes)
 * - Soroban RPC simulation errors (contractError, InsufficientBalance, etc.)
 * - Transaction submission failures (txFailed, txAlreadyExists)
 *
 * This filter normalizes them into a consistent API error response.
 */
@Catch()
export class StellarExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('StellarExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Check if this is a Stellar/Horizon error
    const isStellarError = this.isStellarError(exception);

    if (!isStellarError) {
      // Not a Stellar error — let the global HttpExceptionFilter handle it
      throw exception;
    }

    this.logger.error(
      `Stellar error on ${request.method} ${request.url}: ${exception}`,
    );

    const stellarError = this.normalizeStellarError(exception);

    response.status(stellarError.status).json({
      statusCode: stellarError.status,
      error: 'StellarError',
      message: stellarError.message,
      details: stellarError.details,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private isStellarError(exception: unknown): boolean {
    if (!exception || typeof exception !== 'object') return false;

    const ex = exception as any;

    // Horizon response errors
    if (ex.response?.data?.extras?.result_codes) return true;
    if (ex.response?.data?.problem) return true;

    // Soroban RPC errors
    if (ex.response?.error) return true;
    if (ex.message?.includes('soroban')) return true;
    if (ex.message?.includes('transaction')) return true;
    if (ex.message?.includes('contract')) return true;

    // Stellar SDK errors
    if (ex.name === 'NotFoundError') return true;
    if (ex.name === 'BadResponseError') return true;

    return false;
  }

  private normalizeStellarError(exception: unknown): {
    status: number;
    message: string;
    details: any;
  } {
    const ex = exception as any;

    // Horizon transaction failed
    if (ex.response?.data?.extras?.result_codes) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Transaction failed',
        details: ex.response.data.extras.result_codes,
      };
    }

    // Horizon not found
    if (ex.name === 'NotFoundError') {
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'Resource not found on Stellar network',
        details: null,
      };
    }

    // Soroban RPC error
    if (ex.response?.error) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: ex.response.error || 'Soroban RPC error',
        details: ex.response,
      };
    }

    // Generic Stellar error
    return {
      status: HttpStatus.BAD_GATEWAY,
      message: ex.message || 'Stellar network error',
      details: null,
    };
  }
}
