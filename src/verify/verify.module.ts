import { Module } from '@nestjs/common';
import { VerifyController } from './verify.controller';
import { VerifyService } from './verify.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { OpenFoodFactsProvider } from './providers/openfoodfacts/open-foodfacts.provider';
import { RegionInferenceProvider } from './providers/region-inference-provider/region-inference.provider';
import { VerificationModule } from '../verification/verification.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), HttpModule, VerificationModule],
  controllers: [VerifyController],
  providers: [VerifyService, OpenFoodFactsProvider, RegionInferenceProvider],
})
export class VerifyModule {}
