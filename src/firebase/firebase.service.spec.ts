import { UnauthorizedException } from '@nestjs/common';
import { FirebaseService } from './firebase.service';

jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn(),
  credential: { cert: jest.fn() },
  auth: jest.fn(),
}));

describe('FirebaseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes firebase-admin on module init when no apps exist', () => {
    // Arrange
    const admin = require('firebase-admin');
    admin.apps.length = 0;

    admin.credential.cert.mockReturnValue({ cert: true });

    const configService = {
      get: (key: string) => {
        if (key === 'FIREBASE_PROJECT_ID') return 'proj_1';
        if (key === 'FIREBASE_PRIVATE_KEY') return 'line1\\nline2';
        if (key === 'FIREBASE_CLIENT_EMAIL') return 'a@b.com';
        return undefined;
      },
    };

    const service = new FirebaseService(configService as any);

    // Act
    service.onModuleInit();

    // Assert
    expect(admin.credential.cert).toHaveBeenCalledWith({
      projectId: 'proj_1',
      privateKey: 'line1\nline2',
      clientEmail: 'a@b.com',
    });
    expect(admin.initializeApp).toHaveBeenCalledWith({
      credential: { cert: true },
    });
  });

  it('does not initialize firebase-admin when an app already exists', () => {
    // Arrange
    const admin = require('firebase-admin');
    admin.apps.length = 1;

    const configService = { get: jest.fn() };
    const service = new FirebaseService(configService as any);

    // Act
    service.onModuleInit();

    // Assert
    expect(admin.initializeApp).not.toHaveBeenCalled();
    expect(admin.credential.cert).not.toHaveBeenCalled();
  });

  it('throws when Firebase configuration is missing', () => {
    // Arrange
    const admin = require('firebase-admin');
    admin.apps.length = 0;

    const configService = { get: () => undefined };
    const service = new FirebaseService(configService as any);

    // Act + Assert
    expect(() => service.onModuleInit()).toThrow('Missing Firebase configuration');
  });

  it('verifyToken returns decoded token when verifyIdToken resolves', async () => {
    // Arrange
    const decoded = { uid: 'uid_1' };
    const verifyIdToken = jest.fn().mockResolvedValue(decoded);
    const admin = require('firebase-admin');
    admin.auth.mockReturnValue({ verifyIdToken });

    const configService = { get: jest.fn() };
    const service = new FirebaseService(configService as any);

    // Act
    const result = await service.verifyToken('token_1');

    // Assert
    expect(result).toBe(decoded);
    expect(verifyIdToken).toHaveBeenCalledWith('token_1');
  });

  it('verifyToken throws UnauthorizedException when verifyIdToken rejects', async () => {
    // Arrange
    const verifyIdToken = jest.fn().mockRejectedValue(new Error('bad'));
    const admin = require('firebase-admin');
    admin.auth.mockReturnValue({ verifyIdToken });

    const configService = { get: jest.fn() };
    const service = new FirebaseService(configService as any);

    // Act + Assert
    await expect(service.verifyToken('token_1')).rejects.toEqual(
      new UnauthorizedException('Invalid or expired token'),
    );
  });
});
