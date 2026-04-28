import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { FirebaseUser } from 'src/auth/dto';
import { EditProfileDto } from './userDto/edit-profile.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(user: FirebaseUser) {
    const dbUser = await this.prisma.user.findUnique({
      where: { firebaseUid: user.uid },
      select: {
        id: true,
        firebaseUid: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
        userAllergens: {
          select: {
            id: true,
            severity: true,
            allergen: {
              select: {
                id: true,
                name: true,
                category: true,
                commonNames: true,
              },
            },
          },
        },
      },
    });

    if (!dbUser) {
      throw new NotFoundException('User not found');
    }

    const { userAllergens, ...rest } = dbUser;

    return {
      ...rest,
      allergies: userAllergens.map((ua) => ({
        id: ua.id,
        severity: ua.severity,
        allergen: ua.allergen,
      })),
    };
  }

  async editMe(user: FirebaseUser, dto: EditProfileDto) {
    const data: EditProfileDto = {};
    if (dto.displayName !== undefined) data.displayName = dto.displayName;
    if (dto.avatarUrl !== undefined) data.avatarUrl = dto.avatarUrl;

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No profile fields provided');
    }

    const updated = await this.prisma.user.update({
      where: { firebaseUid: user.uid },
      data,
      select: {
        id: true,
        firebaseUid: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    return updated;
  }
}

//Soterra -- Clarity in every scan