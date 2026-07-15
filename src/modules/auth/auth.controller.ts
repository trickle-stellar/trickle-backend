import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('challenge')
  @Public()
  @ApiOperation({
    summary: 'Get a challenge message for wallet signing',
    description:
      'Returns a challenge message that the user signs with their Freighter wallet. ' +
      'The signed challenge is then sent to /auth/verify to receive a JWT.',
  })
  getChallenge() {
    return this.authService.generateChallenge();
  }

  @Post('verify')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify signed message and return JWT',
    description:
      'Verifies the ed25519 signature produced by Freighter against the claimed public key. ' +
      'If valid, returns a JWT token for authenticated requests.',
  })
  verify(@Body() body: { publicKey: string; signedMessage: string; signature: string }) {
    return this.authService.verifySignature(
      body.publicKey,
      body.signedMessage,
      body.signature,
    );
  }

  @Get('api-keys')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all API keys' })
  listApiKeys() {
    return this.authService.listApiKeys();
  }

  @Post('api-keys')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate a new API key' })
  generateApiKey(@Body() body: { name: string }) {
    return this.authService.generateApiKey(body.name);
  }

  @Delete('api-keys/:id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke an API key' })
  revokeApiKey(@Param('id') id: string) {
    return this.authService.revokeApiKey(id);
  }
}
