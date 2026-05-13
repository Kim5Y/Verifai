import { Injectable } from '@nestjs/common';
import { OpenFoodFactsProvider } from './providers/open-foodfacts.provider';
import { VerifyScanDto } from './verify-dto';

@Injectable()
export class VerifyService {
  constructor(private readonly openFoodFacts: OpenFoodFactsProvider) {}

  async verifyProduct(dto: VerifyScanDto) {
    const OpenFoodFactsLookup = await this.openFoodFacts.lookupProduct(
      dto.code,
    );
    return { ...dto, openFoodFacts: OpenFoodFactsLookup };
  }
}
