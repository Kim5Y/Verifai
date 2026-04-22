import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    if (admin.apps.length === 0) {
      const adminConfig: admin.ServiceAccount = {
        projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
        privateKey: this.configService
          .get<string>('FIREBASE_PRIVATE_KEY')
          ?.replace(/\\n/g, '\n'),
        clientEmail: this.configService.get<string>('FIREBASE_CLIENT_EMAIL'),
      };

      if (
        !adminConfig.projectId ||
        !adminConfig.privateKey ||
        !adminConfig.clientEmail
      ) {
        throw new Error('Missing Firebase configuration');
      }

      admin.initializeApp({
        credential: admin.credential.cert(adminConfig),
      });
    }
  }

  getAuth() {
    return admin.auth();
  }

  async verifyToken(token: string): Promise<admin.auth.DecodedIdToken> {
    try {
      return await this.getAuth().verifyIdToken(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}