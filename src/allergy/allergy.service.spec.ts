import { NotFoundException } from '@nestjs/common';
import type { AllergyService as AllergyServiceType } from './allergy.service';

jest.mock(
  'src/prisma/prisma.service',
  () => ({ PrismaService: class PrismaService {} }),
  { virtual: true },
);

const { AllergyService } = require('./allergy.service') as typeof import('./allergy.service');

describe('AllergyService', () => {
  const baseUser = {
    uid: 'firebase_uid_1',
    email: 'user@example.com',
    name: 'Test User',
    picture: 'https://example.com/avatar.png',
    aud: 'audience_1',
  };

  let service: AllergyServiceType;
  let prisma: { user: { findUnique: jest.Mock }; $transaction: jest.Mock };
  let tx: { userAllergen: { upsert: jest.Mock; deleteMany: jest.Mock } };

  beforeEach(() => {
    tx = {
      userAllergen: {
        upsert: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    prisma = {
      user: { findUnique: jest.fn() },
      $transaction: jest.fn(async (fn: any) => fn(tx)),
    };

    service = new AllergyService(prisma as any);
  });

  describe('addUserAllergies', () => {
    it('throws NotFoundException when user is missing', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.addUserAllergies({ allergens: [] } as any, baseUser as any),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('upserts each allergen for the user', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ id: 'db_user_id' });
      tx.userAllergen.upsert.mockResolvedValue({});

      const dto = {
        allergens: [
          { allergenId: 'a1', severity: 'MILD' },
          { allergenId: 'a2', severity: 'SEVERE' },
        ],
      };

      await expect(service.addUserAllergies(dto as any, baseUser as any)).resolves.toEqual({
        success: true,
      });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(tx.userAllergen.upsert).toHaveBeenCalledTimes(2);
      expect(tx.userAllergen.upsert).toHaveBeenNthCalledWith(1, {
        where: { userId_allergenId: { userId: 'db_user_id', allergenId: 'a1' } },
        create: { userId: 'db_user_id', allergenId: 'a1', severity: 'MILD' },
        update: { severity: 'MILD' },
      });
      expect(tx.userAllergen.upsert).toHaveBeenNthCalledWith(2, {
        where: { userId_allergenId: { userId: 'db_user_id', allergenId: 'a2' } },
        create: { userId: 'db_user_id', allergenId: 'a2', severity: 'SEVERE' },
        update: { severity: 'SEVERE' },
      });
    });
  });

  describe('updateUserAllergies', () => {
    it('throws NotFoundException when user is missing', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.updateUserAllergies({ allergens: [] } as any, baseUser as any),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('deletes removed allergens and upserts provided ones', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ id: 'db_user_id' });
      tx.userAllergen.deleteMany.mockResolvedValue({});
      tx.userAllergen.upsert.mockResolvedValue({});

      const dto = {
        allergens: [
          { allergenId: 'a1', severity: 'MODERATE' },
          { allergenId: 'a3', severity: 'SEVERE' },
        ],
      };

      await expect(service.updateUserAllergies(dto as any, baseUser as any)).resolves.toEqual({
        success: true,
      });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(tx.userAllergen.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'db_user_id', allergenId: { notIn: ['a1', 'a3'] } },
      });
      expect(tx.userAllergen.upsert).toHaveBeenCalledTimes(2);
    });

    it('deletes all user allergens when dto has none', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ id: 'db_user_id' });
      tx.userAllergen.deleteMany.mockResolvedValue({});

      await expect(
        service.updateUserAllergies({ allergens: [] } as any, baseUser as any),
      ).resolves.toEqual({ success: true });

      expect(tx.userAllergen.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'db_user_id' },
      });
      expect(tx.userAllergen.upsert).not.toHaveBeenCalled();
    });
  });
});

