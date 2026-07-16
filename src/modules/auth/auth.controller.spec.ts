import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    generateChallenge: jest.fn().mockReturnValue({ challenge: 'test', nonce: '123' }),
    verifySignature: jest.fn().mockResolvedValue({ accessToken: 'token' }),
    listApiKeys: jest.fn().mockResolvedValue([]),
    generateApiKey: jest.fn().mockResolvedValue({ key: 'raw', id: '1', name: 'test' }),
    revokeApiKey: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get challenge', () => {
    const result = controller.getChallenge();
    expect(result.challenge).toBe('test');
    expect(authService.generateChallenge).toHaveBeenCalled();
  });

  it('should verify signature', async () => {
    const result = await controller.verify({
      publicKey: 'G'.padEnd(56, 'A'),
      signedMessage: 'msg',
      signature: 'sig',
    });
    expect(result.accessToken).toBe('token');
  });
});
