import { Injectable } from '@nestjs/common';
import { OpenFoodFactsProvider } from './providers/open-foodfacts.provider';
import { VerifyScanDto } from './verify-dto';

@Injectable()
export class VerifyService {
  constructor(private readonly openFoodFacts: OpenFoodFactsProvider) {}

  async verifyProduct(verifyScanDto: VerifyScanDto) {
    const openFoodFactsLookupResult = await this.openFoodFacts.lookupProduct(
      verifyScanDto.code,
    );
    return { ...verifyScanDto, openFoodFacts: openFoodFactsLookupResult };
  }
}
