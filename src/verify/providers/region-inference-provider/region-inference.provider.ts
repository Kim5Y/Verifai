import { ConfigService } from '@nestjs/config';
import { Injectable, Logger, Optional } from '@nestjs/common';
import {
  barcodePrefixRules,
  countryRules,
  labelRules,
  languageRules,
  BarcodePrefixRule,
  RegionRule,
} from './rules';
import { Region } from './region.enums';
import {
  InferenceEvidence,
  InferenceResult,
  NormalizedProduct,
} from './interface';
import {
  INFERENCE_WEIGHTS,
  MINIMUM_CONFIDENCE_THRESHOLD,
} from './region.constants';
import { RegionConfidenceMap } from './region.types';

type KeywordIndex = ReadonlyMap<string, ReadonlyArray<Region>>;
type BarcodeIndex = ReadonlyMap<string, ReadonlyArray<Region>>;

@Injectable()
export class RegionInferenceProvider {
  private readonly logger = new Logger(RegionInferenceProvider.name);

  private readonly countryIndex: KeywordIndex;
  private readonly labelIndex: KeywordIndex;
  private readonly languageIndex: KeywordIndex;
  private readonly barcodeIndex: BarcodeIndex;
  private readonly minimumConfidence: number;

  constructor(@Optional() private readonly configService?: ConfigService) {
    this.countryIndex = this.buildKeywordIndex(countryRules);
    this.labelIndex = this.buildKeywordIndex(labelRules);
    this.languageIndex = this.buildLanguageIndex(languageRules);
    this.barcodeIndex = this.buildBarcodeIndex(barcodePrefixRules);
    this.minimumConfidence = this.readMinimumConfidence();
  }

  infer(product: NormalizedProduct): InferenceResult {
    const scores: RegionConfidenceMap = {};
    const evidence: InferenceEvidence[] = [];

    const manufacturingTokens = this.normalizeTokenArray(
      product.manufacturingCountries,
    );
    const purchaseTokens = this.normalizeTokenArray(product.purchaseCountries);
    const languageTokens = this.normalizeTokenArray(product.languages);
    const labelTokens = this.normalizeTokenArray(product.labels);

    this.inferFromKeywordIndex(
      'manufacturing_country',
      manufacturingTokens,
      this.countryIndex,
      INFERENCE_WEIGHTS.MANUFACTURING_COUNTRY,
      scores,
      evidence,
    );

    this.inferFromKeywordIndex(
      'purchase_country',
      purchaseTokens,
      this.countryIndex,
      INFERENCE_WEIGHTS.PURCHASE_COUNTRY,
      scores,
      evidence,
    );

    this.inferFromKeywordIndex(
      'language',
      languageTokens,
      this.languageIndex,
      INFERENCE_WEIGHTS.LANGUAGE,
      scores,
      evidence,
    );

    this.inferFromKeywordIndex(
      'label',
      labelTokens,
      this.labelIndex,
      INFERENCE_WEIGHTS.LABEL,
      scores,
      evidence,
    );

    this.inferFromBarcode(product.barcode, scores, evidence);

    const confidence = this.normalizeScores(scores);

    this.logger.debug(
      JSON.stringify({
        msg: 'region_inference_complete',
        barcode: product.barcode,
        signals: {
          manufacturingCountries: manufacturingTokens.length,
          purchaseCountries: purchaseTokens.length,
          languages: languageTokens.length,
          labels: labelTokens.length,
        },
        inferredRegions: Object.keys(confidence).length,
      }),
    );

    return {
      confidence,
      evidence,
    };
  }

  private readMinimumConfidence(): number {
    const configured = this.configService?.get<string>(
      'REGION_INFERENCE_MINIMUM_CONFIDENCE',
    );
    const value = Number(configured ?? MINIMUM_CONFIDENCE_THRESHOLD);
    if (!Number.isFinite(value)) return MINIMUM_CONFIDENCE_THRESHOLD;
    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
  }

  private normalizeToken(value: string): string {
    if (typeof value !== 'string') return '';
    let normalized = value.trim().toLowerCase();
    if (!normalized) return '';

    normalized = normalized.replace(/^[a-z]{2,3}:/i, '');
    normalized = normalized.replace(/-\d+$/i, '');
    normalized = normalized.replace(/[-_]+/g, ' ');
    normalized = normalized.replace(/\s+/g, ' ').trim();
    return normalized;
  }

  private normalizeTokenArray(
    values?: string[] | null,
  ): Array<{ raw: string; token: string }> {
    if (!Array.isArray(values) || values.length === 0) return [];
    const result: Array<{ raw: string; token: string }> = [];
    for (const raw of values) {
      if (typeof raw !== 'string') continue;
      const token = this.normalizeToken(raw);
      if (!token) continue;
      result.push({ raw, token });
    }
    return result;
  }

  private buildKeywordIndex(rules: RegionRule[]): KeywordIndex {
    const index = new Map<string, Region[]>();

    for (const rule of rules) {
      for (const keyword of rule.keywords) {
        const normalized = this.normalizeToken(keyword);
        if (!normalized) continue;

        const existing = index.get(normalized);
        if (!existing) {
          index.set(normalized, [rule.region]);
          continue;
        }

        if (!existing.includes(rule.region)) {
          existing.push(rule.region);
        }
      }
    }

    return index;
  }

  private buildLanguageIndex(
    rules: ReadonlyArray<{ language: string; regions: Region[] }>,
  ): KeywordIndex {
    const index = new Map<string, Region[]>();
    for (const rule of rules) {
      const normalized = this.normalizeToken(rule.language);
      if (!normalized) continue;

      const existing = index.get(normalized) ?? [];
      for (const region of rule.regions) {
        if (!existing.includes(region)) existing.push(region);
      }
      index.set(normalized, existing);
    }
    return index;
  }

  private buildBarcodeIndex(rules: BarcodePrefixRule[]): BarcodeIndex {
    const index = new Map<string, Region[]>();
    for (const rule of rules) {
      if (!rule.prefix) continue;
      const existing = index.get(rule.prefix) ?? [];
      for (const region of rule.regions) {
        if (!existing.includes(region)) existing.push(region);
      }
      index.set(rule.prefix, existing);
    }
    return index;
  }

  private inferFromBarcode(
    barcode: string,
    scores: RegionConfidenceMap,
    evidence: InferenceEvidence[],
  ): void {
    const digits = (barcode ?? '').replace(/\D/g, '');
    if (!digits) return;

    const prefix3 = digits.slice(0, 3);
    const prefix2 = digits.slice(0, 2);

    const regionsFrom3 = this.barcodeIndex.get(prefix3);
    const regionsFrom2 = this.barcodeIndex.get(prefix2);
    const regions = regionsFrom3 ?? regionsFrom2;
    if (!regions || regions.length === 0) return;
    const matchedPrefix = regionsFrom3 ? prefix3 : prefix2;

    for (const region of regions) {
      this.addScore(scores, region, INFERENCE_WEIGHTS.BARCODE_PREFIX);
      evidence.push({
        region,
        source: 'barcode',
        matchedValue: matchedPrefix,
        weight: INFERENCE_WEIGHTS.BARCODE_PREFIX,
      });
    }
  }

  private inferFromKeywordIndex(
    source: InferenceEvidence['source'],
    tokens: Array<{ raw: string; token: string }>,
    index: KeywordIndex,
    weight: number,
    scores: RegionConfidenceMap,
    evidence: InferenceEvidence[],
  ): void {
    for (const { raw, token } of tokens) {
      const regions = index.get(token);
      if (!regions || regions.length === 0) continue;

      for (const region of regions) {
        this.addScore(scores, region, weight);
        evidence.push({
          region,
          source,
          matchedValue: raw,
          weight,
        });
      }
    }
  }

  private addScore(
    scores: RegionConfidenceMap,
    region: Region,
    weight: number,
  ): void {
    scores[region] = (scores[region] ?? 0) + weight;
  }

  private normalizeScores(scores: RegionConfidenceMap): RegionConfidenceMap {
    const total = Object.values(scores).reduce((sum, score) => sum + score, 0);

    if (total <= 0) {
      return {};
    }

    const normalizedEntries: Array<[Region, number]> = [];

    for (const [region, score] of Object.entries(scores)) {
      const confidence = score / total;
      if (confidence >= this.minimumConfidence) {
        normalizedEntries.push([
          region as Region,
          Number(confidence.toFixed(2)),
        ]);
      }
    }

    normalizedEntries.sort((a, b) => b[1] - a[1]);

    const normalized: RegionConfidenceMap = {};
    for (const [region, confidence] of normalizedEntries) {
      normalized[region] = confidence;
    }

    return normalized;
  }
}
