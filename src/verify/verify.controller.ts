import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { VerifyService } from './verify.service';
import { VerifyScanDto } from './verify-dto';

@Controller('verify')
export class VerifyController {
  constructor(private readonly verifyService: VerifyService) {}

  @HttpCode(HttpStatus.OK)
  @Post('/')
  async verifyProduct(@Body() verifyScanDto: VerifyScanDto) {
    return await this.verifyService.verifyProduct(verifyScanDto);
  }
}
