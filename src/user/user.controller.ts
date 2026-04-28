import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from 'src/auth/decorators';
import { FirebaseAuthGuard } from 'src/auth/guards/firebase-guard/firebase-auth.guard';
import type { FirebaseUser } from 'src/auth/dto';
import { UserService } from './user.service';
import { EditProfileDto } from './userDto/edit-profile.dto';

@UseGuards(FirebaseAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @HttpCode(HttpStatus.OK)
  @Get('me')
  me(@CurrentUser() user: FirebaseUser) {
    return this.userService.getMe(user);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('me')
  editMe(@CurrentUser() user: FirebaseUser, @Body() dto: EditProfileDto) {
    return this.userService.editMe(user, dto);
  }
}
