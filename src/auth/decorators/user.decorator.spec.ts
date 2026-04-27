import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { ExecutionContext } from '@nestjs/common';
import { CurrentUser } from './user.decorator';

describe('CurrentUser decorator', () => {
  it('extracts request.user from the execution context', () => {
    // Arrange
    class TestController {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      handler(_user: unknown) {}
    }

    const decorator = CurrentUser();
    decorator(TestController.prototype, 'handler', 0);

    const routeArgsMetadata = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      TestController,
      'handler',
    ) as Record<
      string,
      { index: number; data: unknown; factory: Function; pipes: unknown[] }
    >;
    const [paramMetadata] = Object.values(routeArgsMetadata);

    const request = { user: { id: 'user_1' } };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    // Act
    const extracted = paramMetadata.factory(paramMetadata.data, ctx);

    // Assert
    expect(extracted).toBe(request.user);
  });
});

