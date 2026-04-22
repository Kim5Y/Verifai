import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FirebaseUser } from './dto';
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

// {
//   name: 'Kimzy',
//   picture: 'https://lh3.googleusercontent.com/a/ACg8ocKW0-wShGLGgVBRew7-H1Ax1ER313WI3IAKtkOW-_Is-QZY_Ts=s96-c',
//   iss: 'https://securetoken.google.com/product-validator-3e181',
//   aud: 'product-validator-3e181',
//   auth_time: 1776852933,
//   user_id: 'Enz3KHi3zLN8LqKiR1kkMKGkEs12',
//   sub: 'Enz3KHi3zLN8LqKiR1kkMKGkEs12',
//   iat: 1776863878,
//   exp: 1776867478,
//   email: 'onlyonekimzy@gmail.com',
//   email_verified: true,
//   firebase: {
//     identities: { 'google.com': [Array], email: [Array] },
//     sign_in_provider: 'google.com'
//   },
//   uid: 'Enz3KHi3zLN8LqKiR1kkMKGkEs12'
// }
