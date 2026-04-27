import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddUserAllergiesDto } from './allergyDto/createAllergy.dto';
import type { FirebaseUser } from 'src/auth/dto';

@Injectable()
export class AllergyService {
  constructor(private prisma: PrismaService) {}
  async addUserAllergies(dto: AddUserAllergiesDto, user: FirebaseUser) {
    const dbUser = await this.prisma.user.findUnique({
      where: { firebaseUid: user.uid },
    });

    if (!dbUser) {
      throw new NotFoundException('User not found');
    }
    const severityByAllergenId = new Map(
      (dto.allergens ?? []).map((a) => [a.allergenId, a.severity] as const),
    );
    const allergenIds = [...severityByAllergenId.keys()];

    await this.prisma.$transaction(async (tx) => {
      await Promise.all(
        allergenIds.map((allergenId) =>
          tx.userAllergen.upsert({
            where: {
              userId_allergenId: { userId: dbUser.id, allergenId },
            },
            create: {
              userId: dbUser.id,
              allergenId,
              severity: severityByAllergenId.get(allergenId)!,
            },
            update: {
              severity: severityByAllergenId.get(allergenId)!,
            },
          }),
        ),
      );
    });

    return { success: true };
  }
  async updateUserAllergies(dto: AddUserAllergiesDto, user: FirebaseUser) {
    const dbUser = await this.prisma.user.findUnique({
      where: { firebaseUid: user.uid },
      select: { id: true },
    });

    if (!dbUser) {
      throw new NotFoundException('User not found');
    }

    const severityByAllergenId = new Map(
      (dto.allergens ?? []).map((a) => [a.allergenId, a.severity] as const),
    );
    const allergenIds = [...severityByAllergenId.keys()];

    await this.prisma.$transaction(async (tx) => {
      await tx.userAllergen.deleteMany({
        where: {
          userId: dbUser.id,
          ...(allergenIds.length
            ? { allergenId: { notIn: allergenIds } }
            : {}),
        },
      });

      await Promise.all(
        allergenIds.map((allergenId) =>
          tx.userAllergen.upsert({
            where: {
              userId_allergenId: { userId: dbUser.id, allergenId },
            },
            create: {
              userId: dbUser.id,
              allergenId,
              severity: severityByAllergenId.get(allergenId)!,
            },
            update: {
              severity: severityByAllergenId.get(allergenId)!,
            },
          }),
        ),
      );
    });

    return { success: true };
  }
}
