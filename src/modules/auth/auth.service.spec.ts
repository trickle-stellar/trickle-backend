import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { ApiKey } from './entities/api-key.entity';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;

  const mockApiKeyRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: getRepositoryToken(ApiKey), useValue: mockApiKeyRepo },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateChallenge', () => {
    it('should return a challenge and nonce', () => {
      const result = service.generateChallenge();
      expect(result.challenge).toBeDefined();
      expect(result.nonce).toBeDefined();
      expect(result.challenge).toContain('trickle-stellar');
    });
  });

  describe('verifySignature', () => {
    it('should reject invalid public key format', async () => {
      await expect(
        service.verifySignature('invalid', 'msg', 'sig'),
      ).rejects.toThrow('Invalid Stellar public key format');
    });

    it('should return access token for valid key format', async () => {
      const fakeKey = 'G'.padEnd(56, 'A');
      const result = await service.verifySignature(fakeKey, 'msg', 'sig');
      expect(result.accessToken).toBe('mock-jwt-token');
    });
  });
});
