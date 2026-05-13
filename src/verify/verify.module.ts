import { Module } from '@nestjs/common';
import { VerifyController } from './verify.controller';
import { VerifyService } from './verify.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { OpenFoodFactsProvider } from './providers/open-foodfacts.provider';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), HttpModule],
  controllers: [VerifyController],
  providers: [VerifyService, OpenFoodFactsProvider],
})
export class VerifyModule {}
