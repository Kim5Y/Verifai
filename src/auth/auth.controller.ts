import { Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from './guards/firebase-guard/firebase-auth.guard';
import { CurrentUser } from './decorators';

@Controller('auth')
@UseGuards(FirebaseAuthGuard)
export class AuthController {
  constructor(private authservice: AuthService) {}
  @HttpCode(HttpStatus.OK)
  @Post('onboard')
  createUser(@CurrentUser() user: any) {
    return this.authservice.createUser(user);
  }
};