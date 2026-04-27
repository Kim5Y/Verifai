import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from './guards/firebase-guard/firebase-auth.guard';
import { CurrentUser } from './decorators';
import type { FirebaseUser } from './dto';

@Controller('auth')
@UseGuards(FirebaseAuthGuard)
export class AuthController {
  constructor(private authservice: AuthService) {}
  @HttpCode(HttpStatus.CREATED)
  @Post('onboard')
  createUser(@CurrentUser() user: FirebaseUser) {
    return this.authservice.createUser(user);
  }
}
