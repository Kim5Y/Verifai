import { Injectable, Logger } from '@nestjs/common';

export enum Region {
  NIGERIA = 'NIGERIA',
  USA = 'USA',
  UK = 'UK',
  FRANCE = 'FRANCE',
  EU = 'EU',
}


export interface NormalizedProduct {
  barcode: string;
  name?: string;
  brand?: string;
  manufacturingCountries: string[];
  purchaseCountries: string[];
  languages: string[];
  labels: string[];
  traces: string[];
  ingredients: string[];
}

export type RegionConfidenceMap = Partial<Record<Region, number>>;

const INFERENCE_WEIGHTS = {
  MANUFACTURING_COUNTRY: 0.6,
  PURCHASE_COUNTRY: 0.6,
  LANGUAGE: 0.3,
  LABEL: 0.8,
  BARCODE_PREFIX: 0.1,
} as const;

type InferenceScores = Partial<Record<Region, number>>;

type EvidenceMatch = {
  matchedValue: string;
  regions: ReadonlyArray<Region>;
};

const REGION_KEYWORDS = {
  countries: {
    [Region.UK]: [
      'united kingdom',
      'uk',
      'great britain',
      'britain',
      'england',
      'angleterre',
      'scotland',
      'wales',
      'northern ireland',
      'royaume-uni',
    ],
    [Region.FRANCE]: ['france', 'french', 'français', 'francais'],
    [Region.NIGERIA]: ['nigeria', 'nigerian', 'naija'],
    [Region.USA]: [
      'united states',
      'united states of america',
      'usa',
      'u.s.a',
      'u.s.',
      'us',
      'america',
    ],
    [Region.EU]: ['european union', 'eu', 'europe'],
  },
  languages: {
    french: [Region.FRANCE, Region.EU],
    fr: [Region.FRANCE, Region.EU],
    english: [Region.UK, Region.USA],
    en: [Region.UK, Region.USA],
  },
  labels: {
    'eu-organic': [Region.EU],
    'en:eu-organic': [Region.EU],
    'fr-bio': [Region.FRANCE],
    'en:fr-bio-01': [Region.FRANCE, Region.EU],
    'fr:ab-agriculture-biologique': [Region.FRANCE],
    'en:soil-association-organic': [Region.UK],
    'en:gb-org': [Region.UK],
    'en:gb-org-': [Region.UK],
  },
} as const;

const BARCODE_PREFIX_TO_REGION_RULES: ReadonlyArray<{
  prefix: string;
  regions: ReadonlyArray<Region>;
}> = [
  { prefix: '50', regions: [Region.UK] },
  { prefix: '30', regions: [Region.FRANCE] },
  { prefix: '60', regions: [Region.NIGERIA] },
  { prefix: '00', regions: [Region.USA] },
  { prefix: '01', regions: [Region.USA] },
  { prefix: '02', regions: [Region.USA] },
  { prefix: '03', regions: [Region.USA] },
  { prefix: '04', regions: [Region.USA] },
  { prefix: '05', regions: [Region.USA] },
  { prefix: '06', regions: [Region.USA] },
  { prefix: '07', regions: [Region.USA] },
  { prefix: '08', regions: [Region.USA] },
  { prefix: '09', regions: [Region.USA] },
] as const;

@Injectable()
export class RegionInferenceProvider {
  private readonly logger = new Logger(RegionInferenceProvider.name);

  infer(product: NormalizedProduct): RegionConfidenceMap {
    const inferenceScores: InferenceScores = {};

    this.logger.debug(`Starting region inference barcode=${product.barcode}`);

    this.inferFromManufacturing(product, inferenceScores);
    this.inferFromPurchasePlaces(product, inferenceScores);
    this.inferFromLanguages(product, inferenceScores);
    this.inferFromLabels(product, inferenceScores);
    this.inferFromBarcode(product, inferenceScores);

    const normalizedScores = this.normalizeScores(inferenceScores);

    this.logger.debug(
      `Region inference completed barcode=${product.barcode} output=${JSON.stringify(
        normalizedScores,
      )}`,
    );

    return normalizedScores;
  }

  private inferFromManufacturing(
    product: NormalizedProduct,
    inferenceScores: InferenceScores,
  ): void {
    if (product.manufacturingCountries.length === 0) {
      return;
    }

    this.logger.debug(
      `Manufacturing evidence=${JSON.stringify(product.manufacturingCountries)}`,
    );

    const evidenceMatches = this.matchCountriesToRegions(product.manufacturingCountries);
    for (const evidenceMatch of evidenceMatches) {
      for (const region of evidenceMatch.regions) {
        this.addScore(
          inferenceScores,
          region,
          INFERENCE_WEIGHTS.MANUFACTURING_COUNTRY,
          `manufacturing=${evidenceMatch.matchedValue}`,
        );
      }
    }
  }

  private inferFromPurchasePlaces(
    product: NormalizedProduct,
    inferenceScores: InferenceScores,
  ): void {
    if (product.purchaseCountries.length === 0) {
      return;
    }

    this.logger.debug(`Purchase evidence=${JSON.stringify(product.purchaseCountries)}`);

    const evidenceMatches = this.matchCountriesToRegions(product.purchaseCountries);
    for (const evidenceMatch of evidenceMatches) {
      for (const region of evidenceMatch.regions) {
        this.addScore(
          inferenceScores,
          region,
          INFERENCE_WEIGHTS.PURCHASE_COUNTRY,
          `purchase=${evidenceMatch.matchedValue}`,
        );
      }
    }
  }

  private inferFromLanguages(
    product: NormalizedProduct,
    inferenceScores: InferenceScores,
  ): void {
    if (product.languages.length === 0) {
      return;
    }

    this.logger.debug(`Languages evidence=${JSON.stringify(product.languages)}`);

    for (const language of product.languages) {
      const normalizedLanguage = this.normalizeToken(language);
      const languageRegions =
        REGION_KEYWORDS.languages[
          normalizedLanguage as keyof typeof REGION_KEYWORDS.languages
        ];
      if (!languageRegions) {
        continue;
      }

      for (const region of languageRegions) {
        this.addScore(
          inferenceScores,
          region,
          INFERENCE_WEIGHTS.LANGUAGE,
          `language=${language}`,
        );
      }
    }
  }

  private inferFromLabels(
    product: NormalizedProduct,
    inferenceScores: InferenceScores,
  ): void {
    if (product.labels.length === 0) {
      return;
    }

    this.logger.debug(`Labels evidence=${JSON.stringify(product.labels)}`);

    for (const label of product.labels) {
      const normalizedLabel = this.normalizeToken(label);
      const directRegions =
        REGION_KEYWORDS.labels[normalizedLabel as keyof typeof REGION_KEYWORDS.labels];

      if (directRegions) {
        for (const region of directRegions) {
          this.addScore(
            inferenceScores,
            region,
            INFERENCE_WEIGHTS.LABEL,
            `label=${label}`,
          );
        }
        continue;
      }

      const labelPrefixRules = Object.entries(REGION_KEYWORDS.labels).filter(
        ([keyword]) => keyword.endsWith('-') && normalizedLabel.startsWith(keyword),
      );

      for (const [keyword, regions] of labelPrefixRules) {
        for (const region of regions) {
          this.addScore(
            inferenceScores,
            region,
            INFERENCE_WEIGHTS.LABEL,
            `label_prefix=${keyword}`,
          );
        }
      }
    }
  }

  private inferFromBarcode(
    product: NormalizedProduct,
    inferenceScores: InferenceScores,
  ): void {
 
    const barcode = product.barcode.trim();
    if (!barcode) {
      return;
    }

    this.logger.debug(`Barcode evidence=${barcode}`);

    for (const rule of BARCODE_PREFIX_TO_REGION_RULES) {
      if (!barcode.startsWith(rule.prefix)) {
        continue;
      }

      for (const region of rule.regions) {
        this.addScore(
          inferenceScores,
          region,
          INFERENCE_WEIGHTS.BARCODE_PREFIX,
          `barcode_prefix=${rule.prefix}`,
        );
      }
    }
  }

  private matchCountriesToRegions(countryTokens: ReadonlyArray<string>): EvidenceMatch[] {
    const evidenceMatches: EvidenceMatch[] = [];

    for (const countryToken of countryTokens) {
      const normalizedCountryToken = this.normalizeToken(countryToken);
      const matchedRegions = new Set<Region>();

      for (const [region, keywords] of Object.entries(REGION_KEYWORDS.countries) as Array<
        [Region, ReadonlyArray<string>]
      >) {
        if (this.containsAny(normalizedCountryToken, keywords)) {
          matchedRegions.add(region);
        }
      }

      if (matchedRegions.size > 0) {
        evidenceMatches.push({
          matchedValue: countryToken,
          regions: Array.from(matchedRegions),
        });
      }
    }

    return evidenceMatches;
  }

  private addScore(
    inferenceScores: InferenceScores,
    region: Region,
    weight: number,
    evidence: string,
  ): void {
    const existingScore = inferenceScores[region] ?? 0;
    const updatedScore = existingScore + weight;
    inferenceScores[region] = updatedScore;

    this.logger.debug(
      `Score added region=${region} weight=${weight} evidence=${evidence} total=${updatedScore}`,
    );
  }

  private containsAny(haystack: string, needles: ReadonlyArray<string>): boolean {
    const normalizedHaystack = this.normalizeToken(haystack);

    for (const needle of needles) {
      const normalizedNeedle = this.normalizeToken(needle);
      if (!normalizedNeedle) {
        continue;
      }
      if (normalizedHaystack.includes(normalizedNeedle)) {
        return true;
      }
    }

    return false;
  }

  private normalizeScores(inferenceScores: InferenceScores): RegionConfidenceMap {

    const rawScores = Object.entries(inferenceScores).filter(
      (entry): entry is [Region, number] => typeof entry[1] === 'number' && entry[1] > 0,
    );

    if (rawScores.length === 0) {
      this.logger.debug('No evidence detected; returning empty confidence map');
      return {};
    }

    const highestScore = rawScores.reduce((max, [, score]) => Math.max(max, score), 0);
    if (highestScore <= 0) {
      return {};
    }

    const normalizedScores: RegionConfidenceMap = {};
    for (const [region, rawScore] of rawScores) {
      normalizedScores[region] = this.roundToTwoDecimals(rawScore / highestScore);
    }

    this.logger.debug(
      `Normalized scores raw=${JSON.stringify(inferenceScores)} normalized=${JSON.stringify(
        normalizedScores,
      )}`,
    );

    return normalizedScores;
  }

  private roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private normalizeToken(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[_/]+/g, ' ')
      .replace(/\s+/g, ' ');
  }
}

