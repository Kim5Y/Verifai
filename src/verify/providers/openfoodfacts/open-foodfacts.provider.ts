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

export interface NormalizedProduct {
  barcode: string;
  name?: string;
  brand?: string;
  quantity?: string;
  imageUrl?: string;
  nutriments?: Record<string, unknown>;
  ingredients: string[];
  allergens: string[];
  traces: string[];
  manufacturingCountries: string[];
  purchaseCountries: string[];
  languages: string[];
  labels: string[];
  rawSource: 'openfoodfacts';
}

export type OpenFoodFactsLookupResult = NormalizedProduct;

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

    return {
      barcode: code,
      name: product.product_name,
      brand: product.brands,
      quantity: product.quantity,
      imageUrl: product.image_front_url ?? product.image_url,
      nutriments: product.nutriments,
      ingredients:
        ingredientsFromText.length > 0 ? ingredientsFromText : ingredientsFromTags,
      allergens: asStringArray(product.allergens_tags),
      traces: asStringArray(product.traces_tags),
      manufacturingCountries: asStringArray(product.manufacturing_places_tags),
      purchaseCountries: asStringArray(product.countries_tags),
      languages: asStringArray(product.languages_hierarchy),
      labels: asStringArray(product.labels_tags),
      rawSource: 'openfoodfacts',
    };
  }
}
