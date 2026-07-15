import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

/**
 * JWT strategy for Freighter wallet-based auth.
 *
 * The JWT payload contains:
 *   - sub: The Stellar public key (G...)
 *   - type: 'wallet' or 'api-key'
 *
 * This strategy extracts the JWT from the Authorization header,
 * verifies it, and attaches the decoded payload to request.user.
 */
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret')!,
    });
  }

  validate(payload: any) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      address: payload.sub,
      type: payload.type,
    };
  }
}
