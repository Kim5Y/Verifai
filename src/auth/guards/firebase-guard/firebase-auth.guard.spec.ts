import { UnauthorizedException } from '@nestjs/common';
import 'dotenv/config';

jest.mock(
  'src/firebase/firebase.service',
  () => ({ FirebaseService: class FirebaseService {} }),
  { virtual: true },
);

const { FirebaseAuthGuard } =
  require('./firebase-auth.guard') as typeof import('./firebase-auth.guard');

describe('FirebaseAuthGuard', () => {
  let originalAudience: string | undefined;

  beforeEach(() => {
    originalAudience = process.env.AUDIENCE;
    process.env.AUDIENCE = 'audience_1';
  });

  afterEach(() => {
    process.env.AUDIENCE = originalAudience;
  });

  it('throws UnauthorizedException("No token provided") when authorization header is missing', async () => {
    // Arrange
    const firebaseService = { getAuth: jest.fn() };
    const guard = new FirebaseAuthGuard(firebaseService as any);
    const request = { headers: {} as Record<string, string> };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as any;

    // Act + Assert
    await expect(guard.canActivate(ctx)).rejects.toEqual(
      new UnauthorizedException('No token provided'),
    );
    expect(firebaseService.getAuth).not.toHaveBeenCalled();
  });

  it('sets request.user and returns true when token is valid and aud matches', async () => {
    // Arrange
    const decoded = { uid: 'uid_1', aud: 'audience_1' };
    const verifyIdToken = jest.fn().mockResolvedValue(decoded);
    const firebaseService = { getAuth: () => ({ verifyIdToken }) };
    const guard = new FirebaseAuthGuard(firebaseService as any);
    const request = { headers: { authorization: 'Bearer token_123' } as any };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as any;

    // Act
    const result = await guard.canActivate(ctx);

    // Assert
    expect(result).toBe(true);
    expect(verifyIdToken).toHaveBeenCalledWith('token_123');
    expect(request['user']).toEqual(decoded);
  });

  it('throws UnauthorizedException("Invalid token") when verifyIdToken rejects', async () => {
    // Arrange
    const verifyIdToken = jest.fn().mockRejectedValue(new Error('bad token'));
    const firebaseService = { getAuth: () => ({ verifyIdToken }) };
    const guard = new FirebaseAuthGuard(firebaseService as any);
    const request = { headers: { authorization: 'Bearer token_123' } as any };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as any;

    // Act + Assert
    await expect(guard.canActivate(ctx)).rejects.toEqual(
      new UnauthorizedException('Invalid token'),
    );
  });

  it('throws UnauthorizedException("Invalid token") when decoded aud does not match AUDIENCE', async () => {
    // Arrange
    const decoded = { uid: 'uid_1', aud: 'wrong_audience' };
    const verifyIdToken = jest.fn().mockResolvedValue(decoded);
    const firebaseService = { getAuth: () => ({ verifyIdToken }) };
    const guard = new FirebaseAuthGuard(firebaseService as any);
    const request = { headers: { authorization: 'Bearer token_123' } as any };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as any;

    // Act + Assert
    await expect(guard.canActivate(ctx)).rejects.toEqual(
      new UnauthorizedException('Invalid token'),
    );
    expect(request['user']).toEqual(decoded);
  });
});
