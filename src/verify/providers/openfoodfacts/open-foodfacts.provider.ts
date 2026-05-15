import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import {
  BadGatewayException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { normalizeTaxonomyArray } from '../../../common/utils/taxonomy-normalizer.util';
import { NormalizedProduct } from '../region-inference-provider/interface/normalized-product.interface';

type OpenFoodFactsProductResponse = {
  status?: 0 | 1;
  status_verbose?: string;
  code?: string;
  product?: {
    product_name?: string;
    brands?: string;
    quantity?: string;
    image_front_url?: string;
    image_url?: string;
    nutriments?: Record<string, unknown>;
    ingredients_text?: string;
    ingredients_tags?: string[];
    allergens_tags?: string[];
    traces_tags?: string[];
    manufacturing_places_tags?: string[];
    countries_tags?: string[];
    languages_hierarchy?: string[];
    labels_tags?: string[];
  };
};

export interface OpenFoodFactsNormalizedProduct extends NormalizedProduct {
  quantity?: string;
  imageUrl?: string;
  nutriments?: Record<string, unknown>;
  allergens: string[];
  rawSource: 'openfoodfacts';
}

export type OpenFoodFactsLookupResult = OpenFoodFactsNormalizedProduct;

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function splitIngredientsText(text?: string): string[] {
  if (!text) return [];
  return text
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

@Injectable()
export class OpenFoodFactsProvider {
  private readonly logger = new Logger(OpenFoodFactsProvider.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private summarizeArray(values: string[]): { count: number; sample: string[] } {
    const sampleLimit = 5;
    return { count: values.length, sample: values.slice(0, sampleLimit) };
  }

  private logNormalization(
    code: string,
    field: string,
    before: string[],
    after: string[],
  ): void {
    this.logger.debug(
      JSON.stringify({
      msg: 'taxonomy_normalization',
      code,
      field,
      before: this.summarizeArray(before),
      after: this.summarizeArray(after),
      }),
    );
  }

  async lookupProduct(code: string): Promise<OpenFoodFactsLookupResult> {
    const baseUrl =
      this.configService.get<string>('OPENFOODFACTS_BASE_URL') ??
      'https://world.openfoodfacts.org';
    const timeoutMilliseconds = Number(
      this.configService.get<string>('OPENFOODFACTS_TIMEOUT_MS') ?? 8000,
    );

    const productLookupUrl = `${baseUrl.replace(/\/$/, '')}/api/v2/product/${encodeURIComponent(
      code,
    )}.json`;

    const response = await firstValueFrom(
      this.httpService.get<OpenFoodFactsProductResponse>(productLookupUrl, {
        timeout: Number.isFinite(timeoutMilliseconds) ? timeoutMilliseconds : 8000,
        validateStatus: () => true,
        headers: {
          'User-Agent': `product-validation-project/${process.env.npm_package_version ?? '0.0.1'}`,
          Accept: 'application/json',
        },
      }),
    );
    if (response.status === 404) {
      throw new NotFoundException(`Product not found for barcode: ${code}`);
    }
    if (response.status >= 500) {
      this.logger.warn(
        `OpenFoodFacts error ${response.status} for barcode ${code}`,
      );
      throw new ServiceUnavailableException(
        'Product lookup provider is temporarily unavailable',
      );
    }
    if (response.status >= 400) {
      this.logger.warn(
        `OpenFoodFacts bad response ${response.status} for barcode ${code}`,
      );
      throw new BadGatewayException(
        'Product lookup provider returned an error',
      );
    }

    const data = response.data;
    if (!data || data.status === 0 || !data.product) {
      throw new NotFoundException(
        data?.status_verbose
          ? `Product not found: ${data.status_verbose}`
          : `Product not found for barcode: ${code}`,
      );
    }

    const product = data.product;
    const ingredientsFromText = splitIngredientsText(product.ingredients_text);
    const ingredientsFromTags = asStringArray(product.ingredients_tags);

    const rawAllergens = asStringArray(product.allergens_tags);
    const rawTraces = asStringArray(product.traces_tags);
    const rawManufacturingCountries = asStringArray(product.manufacturing_places_tags);
    const rawPurchaseCountries = asStringArray(product.countries_tags);
    const rawLanguages = asStringArray(product.languages_hierarchy);
    const rawLabels = asStringArray(product.labels_tags);
    const rawIngredients =
      ingredientsFromText.length > 0 ? ingredientsFromText : ingredientsFromTags;

    const allergens = normalizeTaxonomyArray(rawAllergens);
    const traces = normalizeTaxonomyArray(rawTraces);
    const manufacturingCountries = normalizeTaxonomyArray(rawManufacturingCountries);
    const purchaseCountries = normalizeTaxonomyArray(rawPurchaseCountries);
    const languages = normalizeTaxonomyArray(rawLanguages);
    const labels = normalizeTaxonomyArray(rawLabels);

    const ingredients =
      ingredientsFromText.length > 0
        ? rawIngredients
        : normalizeTaxonomyArray(rawIngredients);

    this.logNormalization(code, 'allergens', rawAllergens, allergens);
    this.logNormalization(code, 'traces', rawTraces, traces);
    this.logNormalization(
      code,
      'manufacturingCountries',
      rawManufacturingCountries,
      manufacturingCountries,
    );
    this.logNormalization(code, 'purchaseCountries', rawPurchaseCountries, purchaseCountries);
    this.logNormalization(code, 'languages', rawLanguages, languages);
    this.logNormalization(code, 'labels', rawLabels, labels);
    if (ingredientsFromText.length === 0) {
      this.logNormalization(code, 'ingredients', rawIngredients, ingredients);
    }

    return {
      barcode: code,
      name: product.product_name,
      brand: product.brands,
      quantity: product.quantity,
      imageUrl: product.image_front_url ?? product.image_url,
      nutriments: product.nutriments,
      ingredients,
      allergens,
      traces,
      manufacturingCountries,
      purchaseCountries,
      languages,
      labels,
      rawSource: 'openfoodfacts',
    };
  }
}
