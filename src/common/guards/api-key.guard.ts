import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from '../../modules/auth/entities/api-key.entity';
import { IS_API_KEY_KEY } from '../decorators/api-key.decorator';
import { createHash } from 'crypto';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiresApiKey = this.reflector.getAllAndOverride<boolean>(
      IS_API_KEY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiresApiKey) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('Missing X-API-Key header');
    }

    const hashedKey = createHash('sha256').update(apiKey).digest('hex');

    const keyRecord = await this.apiKeyRepository.findOne({
      where: { key: hashedKey, isActive: true },
    });

    if (!keyRecord) {
      throw new UnauthorizedException('Invalid API key');
    }

    keyRecord.lastUsedAt = new Date();
    await this.apiKeyRepository.save(keyRecord);

    return true;
  }
}
