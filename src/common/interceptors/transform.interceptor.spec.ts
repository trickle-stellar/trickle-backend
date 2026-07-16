import { TransformInterceptor } from './transform.interceptor';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<any>;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should wrap response in data field', (done) => {
    const mockContext = {} as ExecutionContext;
    const mockCallHandler: CallHandler = {
      handle: () => of({ message: 'ok' }),
    };

    const result$ = interceptor.intercept(mockContext, mockCallHandler);
    result$.subscribe((result) => {
      expect(result.data).toEqual({ message: 'ok' });
      expect(result.timestamp).toBeDefined();
      done();
    });
  });
});
