import { Body, Controller, Post } from '@nestjs/common';
import { VerifyService } from './verify.service';
import { VerifyScanDto } from './verify-dto';

@Controller('verify')
export class VerifyController {
  constructor(private readonly verifyService: VerifyService) {}
  @Post('/')
  async verifyProduct(@Body() verifyScanDto: VerifyScanDto) {
    return await this.verifyService.verifyProduct(verifyScanDto);
  }
}
