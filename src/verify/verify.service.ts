import { Injectable, Logger } from '@nestjs/common';
import { OpenFoodFactsProvider } from './providers/openfoodfacts/open-foodfacts.provider';
import { VerifyScanDto } from './verify-dto';
import { RegionInferenceProvider } from './providers/region-inference-provider/region-inference.provider';
import { VerificationRouterService } from '../verification/router/verification-router.service';
import { NormalizedProduct } from './providers/region-inference-provider/interface/normalized-product.interface';

@Injectable()
export class VerifyService {
  private readonly logger = new Logger(VerifyService.name);
  constructor(
    private readonly openFoodFacts: OpenFoodFactsProvider,
    private readonly regionInferenceProvider: RegionInferenceProvider,
    private readonly verificationRouterService: VerificationRouterService,
  ) {}

  async verifyProduct(verifyScanDto: VerifyScanDto) {
    const openFoodFactsLookupResult = await this.openFoodFacts.lookupProduct(
      verifyScanDto.code,
    );

    const normalizedProduct: NormalizedProduct = {
      barcode: openFoodFactsLookupResult.barcode,
      name: openFoodFactsLookupResult.name,
      brand: openFoodFactsLookupResult.brand,
      manufacturingCountries: openFoodFactsLookupResult.manufacturingCountries,
      purchaseCountries: openFoodFactsLookupResult.purchaseCountries,
      languages: openFoodFactsLookupResult.languages,
      labels: openFoodFactsLookupResult.labels,
      traces: openFoodFactsLookupResult.traces,
      ingredients: openFoodFactsLookupResult.ingredients,
    };

    const regionInferenceResult =
      this.regionInferenceProvider.infer(normalizedProduct);

    const regulatoryVerificationResult =
      await this.verificationRouterService.verifyProduct(
        normalizedProduct,
        regionInferenceResult,
      );

    this.logger.log(
      JSON.stringify({
        msg: 'verify_request_completed',
        barcode: openFoodFactsLookupResult.barcode,
        regulatoryStatus: regulatoryVerificationResult.status,
        inferredRegions: Object.keys(regionInferenceResult.confidence ?? {}).length,
      }),
    );

    return {
      ...verifyScanDto,
      regionInference: regionInferenceResult,
      regulatoryVerification: regulatoryVerificationResult,
    };
  }
}
