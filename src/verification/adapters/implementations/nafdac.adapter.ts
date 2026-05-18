import { Injectable, Logger } from '@nestjs/common';
import { RegulatoryAdapterImplementation } from '../regulatory-adapter.decorator';
import { RegulatoryAdapter } from '../regulatory-adapter.interface';
import { VerificationResult } from '../../contracts/verification-result.interface';
import { Region } from '../../../verify/providers/region-inference-provider/region.enums';
import { NormalizedProduct } from '../../../verify/providers/region-inference-provider/interface/normalized-product.interface';

@RegulatoryAdapterImplementation()
@Injectable()
export class NAFDACAdapter implements RegulatoryAdapter {
  readonly region = Region.NIGERIA;

  private readonly logger = new Logger(NAFDACAdapter.name);

  async verifyProduct(product: NormalizedProduct): Promise<VerificationResult> {
    const verificationStartedAt = new Date();

    try {
      const labels = this.normalizeStringArray(product.labels);
      const traces = this.normalizeStringArray(product.traces);
      const ingredients = this.normalizeStringArray(product.ingredients);
      const manufacturingCountries = this.normalizeStringArray(
        product.manufacturingCountries,
      );

      const hasNigeriaSignal =
        manufacturingCountries.some((value) => value.includes('nigeria')) ||
        labels.some((value) => value.includes('nafdac')) ||
        traces.some((value) => value.includes('nafdac'));

      this.logger.log(
        JSON.stringify({
          msg: 'regulatory_verification_attempt',
          regulator: 'NAFDAC',
          barcode: product.barcode,
          hasNigeriaSignal,
        }),
      );

      if (!hasNigeriaSignal) {
        return {
          verified: false,
          status: 'NOT_FOUND',
          regulator: 'NAFDAC',
          region: Region.NIGERIA,
          confidence: 0.3,
          warnings: ['no_ng_signals_detected'],
          metadata: {
            signals: {
              labels: labels.length,
              traces: traces.length,
              ingredients: ingredients.length,
            },
          },
          verifiedAt: verificationStartedAt.toISOString(),
        };
      }

      const potentiallyNonCompliant = ingredients.some((value) =>
        value.includes('chloramphenicol'),
      );

      if (potentiallyNonCompliant) {
        return {
          verified: false,
          status: 'PENDING',
          regulator: 'NAFDAC',
          region: Region.NIGERIA,
          confidence: 0.6,
          warnings: ['manual_review_recommended'],
          metadata: {
            reason: 'ingredient_requires_manual_review',
          },
          verifiedAt: verificationStartedAt.toISOString(),
        };
      }

      return {
        verified: true,
        status: 'VERIFIED',
        regulator: 'NAFDAC',
        region: Region.NIGERIA,
        confidence: 0.7,
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
          regulator: 'NAFDAC',
          barcode: product.barcode,
          errorName: errorObject?.name,
          errorMessage: errorObject?.message,
        }),
      );

      return {
        verified: false,
        status: 'ERROR',
        regulator: 'NAFDAC',
        region: Region.NIGERIA,
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
}
