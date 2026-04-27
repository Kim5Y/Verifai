import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AllergyService } from './allergy.service';
import { FirebaseAuthGuard } from 'src/auth/guards/firebase-guard/firebase-auth.guard';
import { AddUserAllergiesDto } from './allergyDto/createAllergy.dto';
import { CurrentUser } from 'src/auth/decorators';
import type { FirebaseUser } from 'src/auth/dto';
@UseGuards(FirebaseAuthGuard)
@Controller('allergy')
export class AllergyController {
  constructor(private allergyService: AllergyService) {}
  @HttpCode(HttpStatus.CREATED)
  @Post('/')
  addUserAllergies(
    @Body() dto: AddUserAllergiesDto,
    @CurrentUser() user: FirebaseUser,
  ) {
    return this.allergyService.addUserAllergies(dto, user);
  }
  @HttpCode(HttpStatus.OK)
  @Patch('/')
  updateUserAllergies(
    @Body() dto: AddUserAllergiesDto,
    @CurrentUser() user: FirebaseUser,
  ) {
    return this.allergyService.updateUserAllergies(dto, user);
  }
}
