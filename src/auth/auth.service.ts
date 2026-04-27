import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { FirebaseUser } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}
  async createUser(user: FirebaseUser) {
    if (user.aud !== process.env.AUDIENCE) {
      throw new UnauthorizedException();
    }

    try {
      const existingUser = await this.prisma.user.upsert({
        where: { email: user.email },
        update: {
          firebaseUid: user.uid,
          displayName: user.name,
          avatarUrl: user.picture,
        },
        create: {
          firebaseUid: user.uid,
          email: user.email,
          displayName: user.name,
          avatarUrl: user.picture,
        },
      });
      return { success: true };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        const fields = e.meta?.target as string[];
        if (fields?.includes('firebaseUid') || fields?.includes('email')) {
          return { isNewUser: false, success: true };
        }
      }
      throw e;
    }
  }
}
