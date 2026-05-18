import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdapterRegistry } from '../registry/adapter.registry';
import { VerificationResult } from '../contracts/verification-result.interface';
import { NormalizedProduct } from '../../verify/providers/region-inference-provider/interface/normalized-product.interface';
import { InferenceResult } from '../../verify/providers/region-inference-provider/interface/inference-result.interface';
import { Region } from '../../verify/providers/region-inference-provider/region.enums';
import {
  buildRegionCandidates,
  expandWithFallbackRegions,
  rankRegionCandidates,
  RegionCandidate,
} from './region-routing.helpers';

@Injectable()
export class VerificationRouterService {
  private readonly logger = new Logger(VerificationRouterService.name);

  private readonly minimumConfidence: number;

  constructor(
    private readonly adapterRegistry: AdapterRegistry,
    @Optional() private readonly configService?: ConfigService,
  ) {
    this.minimumConfidence = this.readMinimumConfidence();
  }

  async verifyProduct(
    product: NormalizedProduct,
    inferenceResult: InferenceResult,
  ): Promise<VerificationResult> {
    const confidenceByRegion = inferenceResult?.confidence ?? {};
    const candidates = buildRegionCandidates(confidenceByRegion);
    const rankedCandidates = rankRegionCandidates(candidates);
    const expandedCandidates = expandWithFallbackRegions(rankedCandidates);

    const mostLikelyCandidate = expandedCandidates[0];
    if (
      !mostLikelyCandidate ||
      mostLikelyCandidate.confidence < this.minimumConfidence
    ) {
      this.logger.warn(
        JSON.stringify({
          msg: 'regulatory_verification_low_confidence',
          barcode: product?.barcode,
          minimumConfidence: this.minimumConfidence,
          topCandidate: mostLikelyCandidate,
        }),
      );

      return {
        verified: false,
        status: 'UNSUPPORTED',
        warnings: ['region_confidence_too_low'],
        metadata: {
          minimumConfidence: this.minimumConfidence,
          candidates: expandedCandidates,
          evidence: inferenceResult?.evidence ?? [],
        },
        verifiedAt: new Date().toISOString(),
      };
    }

    const attemptedRegions: Region[] = [];

    for (const candidate of expandedCandidates) {
      attemptedRegions.push(candidate.region);
      const adapter = this.adapterRegistry.getAdapter(candidate.region);

      if (!adapter) {
        this.logger.warn(
          JSON.stringify({
            msg: 'regulatory_adapter_missing',
            barcode: product?.barcode,
            region: candidate.region,
          }),
        );
        continue;
      }

      this.logger.log(
        JSON.stringify({
          msg: 'regulatory_adapter_selected',
          barcode: product?.barcode,
          region: candidate.region,
          confidence: candidate.confidence,
          adapterClass: adapter.constructor?.name,
        }),
      );

      try {
        const result = await adapter.verifyProduct(product);
        const enrichedResult = this.enrichResult(
          result,
          candidate,
          attemptedRegions,
          inferenceResult,
        );

        if (enrichedResult.status !== 'ERROR') return enrichedResult;

        this.logger.warn(
          JSON.stringify({
            msg: 'regulatory_verification_error_result',
            barcode: product?.barcode,
            region: candidate.region,
            regulator: enrichedResult.regulator,
          }),
        );
      } catch (error) {
        const errorObject = error as Error;
        this.logger.error(
          JSON.stringify({
            msg: 'regulatory_adapter_execution_failed',
            barcode: product?.barcode,
            region: candidate.region,
            adapterClass: adapter.constructor?.name,
            errorName: errorObject?.name,
            errorMessage: errorObject?.message,
          }),
        );
      }
    }

    this.logger.warn(
      JSON.stringify({
        msg: 'regulatory_verification_unsupported_region',
        barcode: product?.barcode,
        attemptedRegions,
      }),
    );

    return {
      verified: false,
      status: 'UNSUPPORTED',
      region: mostLikelyCandidate.region,
      confidence: mostLikelyCandidate.confidence,
      warnings: ['no_supported_regulatory_adapter'],
      metadata: {
        attemptedRegions,
        candidates: expandedCandidates,
        evidence: inferenceResult?.evidence ?? [],
        supportedRegions: this.adapterRegistry.getSupportedRegions(),
      },
      verifiedAt: new Date().toISOString(),
    };
  }

  private enrichResult(
    result: VerificationResult,
    candidate: RegionCandidate,
    attemptedRegions: Region[],
    inferenceResult: InferenceResult,
  ): VerificationResult {
    const metadata: Record<string, unknown> = {
      attemptedRegions,
      evidence: inferenceResult?.evidence ?? [],
      ...(result.metadata ?? {}),
    };

    return {
      ...result,
      region: result.region ?? candidate.region,
      confidence: result.confidence ?? candidate.confidence,
      metadata,
      verifiedAt: result.verifiedAt ?? new Date().toISOString(),
    };
  }

  private readMinimumConfidence(): number {
    const configured = this.configService?.get<string>(
      'REGULATORY_VERIFICATION_MINIMUM_CONFIDENCE',
    );
    const value = Number(configured ?? 0.25);
    if (!Number.isFinite(value)) return 0.25;
    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
  }
}
