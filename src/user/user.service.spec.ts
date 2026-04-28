import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { UserService as UserServiceType } from './user.service';

jest.mock(
  'src/prisma/prisma.service',
  () => ({ PrismaService: class PrismaService {} }),
  { virtual: true },
);

const { UserService } = require('./user.service') as typeof import('./user.service');

describe('UserService', () => {
  const baseUser = {
    uid: 'firebase_uid_1',
    email: 'user@example.com',
    name: 'Test User',
    picture: 'https://example.com/avatar.png',
    aud: 'audience_1',
  };

  let service: UserServiceType;
  let prisma: { user: { findUnique: jest.Mock; update: jest.Mock } };

  beforeEach(() => {
    prisma = { user: { findUnique: jest.fn(), update: jest.fn() } };
    service = new UserService(prisma as any);
  });

  it('throws NotFoundException when user is missing', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);

    await expect(service.getMe(baseUser as any)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns user profile with allergies', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'db_user_id',
      firebaseUid: baseUser.uid,
      email: baseUser.email,
      displayName: 'Display',
      avatarUrl: 'https://example.com/a.png',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      userAllergens: [
        {
          id: 'ua1',
          severity: 'MILD',
          allergen: {
            id: 'a1',
            name: 'Peanut',
            category: 'NUT',
            commonNames: ['groundnut'],
          },
        },
      ],
    });

    await expect(service.getMe(baseUser as any)).resolves.toEqual({
      id: 'db_user_id',
      firebaseUid: baseUser.uid,
      email: baseUser.email,
      displayName: 'Display',
      avatarUrl: 'https://example.com/a.png',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      allergies: [
        {
          id: 'ua1',
          severity: 'MILD',
          allergen: {
            id: 'a1',
            name: 'Peanut',
            category: 'NUT',
            commonNames: ['groundnut'],
          },
        },
      ],
    });
  });

  describe('editMe', () => {
    it('throws BadRequestException when no fields are provided', async () => {
      await expect(service.editMe(baseUser as any, {} as any)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('updates displayName and avatarUrl', async () => {
      prisma.user.update.mockResolvedValueOnce({
        id: 'db_user_id',
        firebaseUid: baseUser.uid,
        email: baseUser.email,
        displayName: 'New Name',
        avatarUrl: 'https://example.com/new.png',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      });

      await expect(
        service.editMe(baseUser as any, {
          displayName: 'New Name',
          avatarUrl: 'https://example.com/new.png',
        } as any),
      ).resolves.toEqual({
        id: 'db_user_id',
        firebaseUid: baseUser.uid,
        email: baseUser.email,
        displayName: 'New Name',
        avatarUrl: 'https://example.com/new.png',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { firebaseUid: baseUser.uid },
        data: {
          displayName: 'New Name',
          avatarUrl: 'https://example.com/new.png',
        },
        select: {
          id: true,
          firebaseUid: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          createdAt: true,
        },
      });
    });
  });
});
