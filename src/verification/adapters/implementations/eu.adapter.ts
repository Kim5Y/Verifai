import { Injectable, Logger } from '@nestjs/common';
import { RegulatoryAdapterImplementation } from '../regulatory-adapter.decorator';
import { RegulatoryAdapter } from '../regulatory-adapter.interface';
import { VerificationResult } from '../../contracts/verification-result.interface';
import { Region } from '../../../verify/providers/region-inference-provider/region.enums';
import { NormalizedProduct } from '../../../verify/providers/region-inference-provider/interface/normalized-product.interface';

@RegulatoryAdapterImplementation()
@Injectable()
export class EUAdapter implements RegulatoryAdapter {
  readonly region = Region.EU;

  private readonly logger = new Logger(EUAdapter.name);

  async verifyProduct(product: NormalizedProduct): Promise<VerificationResult> {
    const verificationStartedAt = new Date();

    try {
      const labels = this.normalizeStringArray(product.labels);
      const languages = this.normalizeStringArray(product.languages);
      const manufacturingCountries = this.normalizeStringArray(
        product.manufacturingCountries,
      );

      const hasEuropeanSignal =
        labels.some((value) => value.includes('eu')) ||
        labels.some((value) => value.includes('european')) ||
        manufacturingCountries.some((value) => this.isEuropeanCountryToken(value));

      this.logger.log(
        JSON.stringify({
          msg: 'regulatory_verification_attempt',
          regulator: 'EU',
          barcode: product.barcode,
          hasEuropeanSignal,
        }),
      );

      if (!hasEuropeanSignal) {
        return {
          verified: false,
          status: 'NOT_FOUND',
          regulator: 'EU',
          region: Region.EU,
          confidence: 0.25,
          warnings: ['no_eu_signals_detected'],
          metadata: {
            signals: {
              labels: labels.length,
              languages: languages.length,
              manufacturingCountries: manufacturingCountries.length,
            },
          },
          verifiedAt: verificationStartedAt.toISOString(),
        };
      }

      const hasMultipleLanguages = new Set(languages).size >= 2;
      const warnings = hasMultipleLanguages ? ['multi_language_packaging'] : [];

      return {
        verified: true,
        status: 'VERIFIED',
        regulator: 'EU',
        region: Region.EU,
        confidence: 0.65,
        warnings: warnings.length > 0 ? warnings : undefined,
        metadata: {
          verificationMethod: 'heuristic_precheck',
        },
        verifiedAt: verificationStartedAt.toISOString(),
      };
    } catch (error) {
      const errorObject = error as Error;
      this.logger.error(
        JSON.stringify({
          msg: 'regulatory_verification_failed',
          regulator: 'EU',
          barcode: product.barcode,
          errorName: errorObject?.name,
          errorMessage: errorObject?.message,
        }),
      );

      return {
        verified: false,
        status: 'ERROR',
        regulator: 'EU',
        region: Region.EU,
        metadata: {
          errorName: errorObject?.name,
          errorMessage: errorObject?.message,
        },
        verifiedAt: verificationStartedAt.toISOString(),
      };
    }
  }

  private normalizeStringArray(values: readonly string[]): string[] {
    if (!Array.isArray(values)) return [];
    return values
      .filter((value) => typeof value === 'string')
      .map((value) => value.trim().toLowerCase())
      .filter((value) => value.length > 0);
  }

  private isEuropeanCountryToken(value: string): boolean {
    const europeanCountryTokens = [
      'france',
      'germany',
      'spain',
      'italy',
      'netherlands',
      'belgium',
      'portugal',
      'poland',
      'sweden',
      'finland',
      'denmark',
      'ireland',
      'austria',
    ];
    return europeanCountryTokens.some((token) => value.includes(token));
  }
}
