import { SetMetadata } from '@nestjs/common';

export const IS_API_KEY_KEY = 'isApiKey';
export const UseApiKey = () => SetMetadata(IS_API_KEY_KEY, true);
