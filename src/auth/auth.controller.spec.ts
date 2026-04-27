jest.mock('./auth.service', () => ({ AuthService: class AuthService {} }));
jest.mock('./guards/firebase-guard/firebase-auth.guard', () => ({
  FirebaseAuthGuard: class FirebaseAuthGuard {},
}));

const { AuthController } = require('./auth.controller') as typeof import('./auth.controller');

describe('AuthController', () => {
  it('delegates createUser to AuthService.createUser', () => {
    // Arrange
    const user = { uid: 'uid_1' };
    const authService = { createUser: jest.fn().mockReturnValue({ ok: true }) };
    const controller = new AuthController(authService as any);

    // Act
    const result = controller.createUser(user);

    // Assert
    expect(authService.createUser).toHaveBeenCalledWith(user);
    expect(result).toEqual({ ok: true });
  });
});

