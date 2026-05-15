import { Injectable, Logger } from '@nestjs/common';
import { COUNTRY_RULES } from './rules';
// import { BARCODE_PREFIX_TO_REGION_RULES } from './rules';
import { Region } from './region.enums';
import { InferenceEvidence, InferenceResult, NormalizedProduct } from './interface';
import { INFERENCE_WEIGHTS, MINIMUM_CONFIDENCE_THRESHOLD } from './region.constants';
import {
  // InferenceScores,
  RegionConfidenceMap,
  // EvidenceMatch,
} from './region.types';


@Injectable()
export class RegionInferenceProvider {
  private readonly logger = new Logger(
    RegionInferenceProvider.name,
  );

  infer(
    product: NormalizedProduct,
  ): InferenceResult {
    const scores: RegionConfidenceMap = {};

    const evidence: InferenceEvidence[] = [];

    this.inferManufacturing(
      product,
      scores,
      evidence,
    );

    this.inferPurchaseCountries(
      product,
      scores,
      evidence,
    );

    const confidence =
      this.normalizeScores(scores);

    return {
      confidence,
      evidence,
    };
  }

  private inferManufacturing(
    product: NormalizedProduct,
    scores: RegionConfidenceMap,
    evidence: InferenceEvidence[],
  ): void {
    for (const country of product.manufacturingCountries) {
      const normalized =
        this.normalize(country);

      for (const [region, keywords] of Object.entries(
        COUNTRY_RULES,
      )) {
        if (
          keywords.includes(normalized)
        ) {
          this.addScore(
            scores,
            region as Region,
            INFERENCE_WEIGHTS.MANUFACTURING_COUNTRY,
          );

          evidence.push({
            region: region as Region,
            source:
              'manufacturing_country',
            matchedValue: country,
            weight:
              INFERENCE_WEIGHTS.MANUFACTURING_COUNTRY,
          });
        }
      }
    }
  }

  private inferPurchaseCountries(
    product: NormalizedProduct,
    scores: RegionConfidenceMap,
    evidence: InferenceEvidence[],
  ): void {
    for (const country of product.purchaseCountries) {
      const normalized =
        this.normalize(country);

      for (const [region, keywords] of Object.entries(
        COUNTRY_RULES,
      )) {
        if (
          keywords.includes(normalized)
        ) {
          this.addScore(
            scores,
            region as Region,
            INFERENCE_WEIGHTS.PURCHASE_COUNTRY,
          );

          evidence.push({
            region: region as Region,
            source: 'purchase_country',
            matchedValue: country,
            weight:
              INFERENCE_WEIGHTS.PURCHASE_COUNTRY,
          });
        }
      }
    }
  }

  private addScore(
    scores: RegionConfidenceMap,
    region: Region,
    weight: number,
  ): void {
    scores[region] =
      (scores[region] ?? 0) + weight;
  }

  private normalizeScores(
    scores: RegionConfidenceMap,
  ): RegionConfidenceMap {
    const total =
      Object.values(scores).reduce(
        (sum, score) => sum + score,
        0,
      );

    if (total <= 0) {
      return {};
    }

    const normalized: RegionConfidenceMap =
      {};

    for (const [region, score] of Object.entries(
      scores,
    )) {
      const confidence = score / total;

      if (
        confidence >=
        MINIMUM_CONFIDENCE_THRESHOLD
      ) {
        normalized[region as Region] =
          Number(confidence.toFixed(2));
      }
    }

    return normalized;
  }

  private normalize(
    value: string,
  ): string {
    return value
      .trim()
      .toLowerCase();
  }
}