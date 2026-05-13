import { Body, Controller, Post } from '@nestjs/common';
import { VerifyService } from './verify.service';
import { VerifyScanDto } from './verify-dto';

@Controller('verify')
export class VerifyController {
  constructor(private verifyservice: VerifyService) {}
  @Post('/')
  async verifyProduct(@Body() dto: VerifyScanDto) {
    return await this.verifyservice.verifyProduct(dto);
  }
}