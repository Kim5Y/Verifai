import { Injectable, Logger } from '@nestjs/common';
import { RegulatoryAdapterImplementation } from '../regulatory-adapter.decorator';
import { RegulatoryAdapter } from '../regulatory-adapter.interface';
import { VerificationResult } from '../../contracts/verification-result.interface';
import { Region } from '../../../verify/providers/region-inference-provider/region.enums';
import { NormalizedProduct } from '../../../verify/providers/region-inference-provider/interface/normalized-product.interface';

@RegulatoryAdapterImplementation()
@Injectable()
export class FDAAdapter implements RegulatoryAdapter {
  readonly region = Region.USA;

  private readonly logger = new Logger(FDAAdapter.name);

  async verifyProduct(product: NormalizedProduct): Promise<VerificationResult> {
    const verificationStartedAt = new Date();

    try {
      const manufacturingCountries = this.normalizeStringArray(
        product.manufacturingCountries,
      );
      const purchaseCountries = this.normalizeStringArray(
        product.purchaseCountries,
      );
      const labels = this.normalizeStringArray(product.labels);

      const hasUnitedStatesSignal =
        manufacturingCountries.some((value) => this.containsUnitedStates(value)) ||
        purchaseCountries.some((value) => this.containsUnitedStates(value)) ||
        labels.some((value) => value.includes('fda'));

      this.logger.log(
        JSON.stringify({
          msg: 'regulatory_verification_attempt',
          regulator: 'FDA',
          barcode: product.barcode,
          hasUnitedStatesSignal,
        }),
      );

      if (!hasUnitedStatesSignal) {
        return {
          verified: false,
          status: 'NOT_FOUND',
          regulator: 'FDA',
          region: Region.USA,
          confidence: 0.3,
          warnings: ['no_us_signals_detected'],
          metadata: {
            signals: {
              manufacturingCountries: manufacturingCountries.length,
              purchaseCountries: purchaseCountries.length,
              labels: labels.length,
            },
          },
          verifiedAt: verificationStartedAt.toISOString(),
        };
      }

      return {
        verified: true,
        status: 'VERIFIED',
        regulator: 'FDA',
        region: Region.USA,
        confidence: 0.75,
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
          regulator: 'FDA',
          barcode: product.barcode,
          errorName: errorObject?.name,
          errorMessage: errorObject?.message,
        }),
      );

      return {
        verified: false,
        status: 'ERROR',
        regulator: 'FDA',
        region: Region.USA,
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

  private containsUnitedStates(value: string): boolean {
    return (
      value.includes('united states') ||
      value === 'usa' ||
      value === 'us' ||
      value.includes('u.s.')
    );
  }
}
