import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash, randomBytes } from 'crypto';
import { ApiKey } from './entities/api-key.entity';
import * as StellarSdk from '@stellar/stellar-sdk';

/**
 * AuthService handles two authentication patterns:
 *
 * 1. **Freighter Wallet Signing** (primary, for users):
 *    - Backend generates a challenge message containing a timestamp + nonce
 *    - User signs the message with their Freighter wallet (ed25519 signature)
 *    - Backend verifies the signature against the claimed public key
 *    - If valid, issues a JWT containing the wallet address
 *
 * 2. **API Keys** (for service-to-service):
 *    - Admin generates an API key via the admin endpoint
 *    - Services include it in X-API-Key header
 *    - Backend hashes the key and looks it up in the database
 *
 * The Freighter pattern is the one most contributors will be unfamiliar with.
 * It works because ed25519 signatures are deterministic — given a public key
 * and a message, the signature proves the caller controls the private key.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
  ) {}

  /**
   * Generate a challenge message for wallet signing.
   *
   * The challenge is a short message that includes:
   * - A timestamp (prevents replay attacks)
   * - A random nonce (ensures uniqueness)
   * - A domain binding (prevents cross-site signing)
   *
   * The user signs this exact message with Freighter, then sends
   * back the signature for verification.
   *
   * @returns The challenge message and nonce to display to the user
   */
  generateChallenge(): { challenge: string; nonce: string } {
    const nonce = randomBytes(16).toString('hex');
    const timestamp = Date.now();
    const domain = 'trickle-stellar';

    // The message format must match exactly between generation and verification
    const challenge = `${domain}:${timestamp}:${nonce}`;

    this.logger.debug(`Generated challenge: ${challenge}`);

    return { challenge, nonce };
  }

  /**
   * Verify a Freighter wallet signature and issue a JWT.
   *
   * This is the core of wallet-based authentication:
   * 1. The user signs the challenge message with their Freighter wallet
   * 2. Freighter produces an ed25519 signature over the message
   * 3. We verify the signature against the claimed public key
   * 4. If valid, the caller proves they control the wallet
   * 5. We issue a JWT with the wallet address as the subject
   *
   * TODO: Implement full signature verification using StellarSdk.
   * The verification logic uses ed25519-dalek or nacl to verify:
   *   Ed25519PublicKey.verify(message, signature, publicKey)
   *
   * @param publicKey - The Stellar public key (G...)
   * @param signedMessage - The challenge message that was signed
   * @param signature - The ed25519 signature from Freighter
   * @returns A JWT token containing the wallet address
   */
  async verifySignature(
    publicKey: string,
    signedMessage: string,
    signature: string,
  ): Promise<{ accessToken: string }> {
    this.logger.debug(`Verifying signature for ${publicKey}`);

    // TODO: Implement signature verification
    //   1. Validate publicKey format (starts with G, 56 chars)
    //   2. Recreate the expected challenge message
    //   3. Verify ed25519 signature:
    //      const key = StellarSdk.Keypair.fromPublicKey(publicKey);
    //      const isValid = key.verify(Buffer.from(signedMessage), Buffer.from(signature, 'hex'));
    //   4. If invalid, throw UnauthorizedException
    //   5. Optionally: check nonce hasn't been used (replay protection)
    //
    // For now, we trust the signature and issue the JWT.
    // This is a security gap that MUST be closed before production.

    if (!publicKey.startsWith('G') || publicKey.length !== 56) {
      throw new UnauthorizedException('Invalid Stellar public key format');
    }

    const payload = {
      sub: publicKey,
      type: 'wallet',
    };

    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }

  // ─── API Key Management ──────────────────────────────────────────────────

  /**
   * Generate a new API key for service-to-service access.
   *
   * Returns the raw key ONCE — it's hashed before storage.
   * The caller must store it securely; we can't retrieve it later.
   *
   * @param name - A human-readable name for the key (e.g., "indexer-service")
   * @returns The raw API key and its metadata
   */
  async generateApiKey(
    name: string,
  ): Promise<{ key: string; id: string; name: string }> {
    const rawKey = `trickle_${randomBytes(32).toString('hex')}`;
    const hashedKey = createHash('sha256').update(rawKey).digest('hex');

    const apiKey = this.apiKeyRepository.create({
      key: hashedKey,
      name,
      isActive: true,
    });

    const saved = await this.apiKeyRepository.save(apiKey);

    this.logger.log(`Generated API key "${name}" (${saved.id})`);

    return {
      key: rawKey,
      id: saved.id,
      name: saved.name,
    };
  }

  /**
   * List all API keys (hashed, not raw).
   */
  async listApiKeys(): Promise<Partial<ApiKey>[]> {
    return this.apiKeyRepository.find({
      select: ['id', 'name', 'isActive', 'createdAt', 'lastUsedAt'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Revoke an API key.
   */
  async revokeApiKey(id: string): Promise<void> {
    await this.apiKeyRepository.update(id, { isActive: false });
    this.logger.log(`Revoked API key ${id}`);
  }
}
