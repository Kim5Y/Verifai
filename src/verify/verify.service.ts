import { Injectable, Logger } from '@nestjs/common';
import { OpenFoodFactsProvider } from './providers/openfoodfacts/open-foodfacts.provider';
import { VerifyScanDto } from './verify-dto';
import { RegionInferenceProvider } from './providers/region-inference-provider/region-inference.provider';

@Injectable()
export class VerifyService {
  private readonly logger = new Logger(VerifyService.name);
  constructor(
    private readonly openFoodFacts: OpenFoodFactsProvider,
    private readonly regionInferenceProvider: RegionInferenceProvider,
  ) {}

  async verifyProduct(verifyScanDto: VerifyScanDto) {
    const openFoodFactsLookupResult = await this.openFoodFacts.lookupProduct(
      verifyScanDto.code,
    );

    this.logger.log(openFoodFactsLookupResult);
    const { quantity, imageUrl, allergens, rawSource, ...rest } =
      openFoodFactsLookupResult;
    const getCauntryScore = this.regionInferenceProvider.infer(rest);
    return { ...verifyScanDto, getCauntryScore };
  }
}