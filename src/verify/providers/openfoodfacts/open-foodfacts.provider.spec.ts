import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import {
  BadGatewayException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { OpenFoodFactsProvider } from './open-foodfacts.provider';

describe('OpenFoodFactsProvider', () => {
  let provider: OpenFoodFactsProvider;
  let httpService: { get: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    httpService = { get: jest.fn() };
    configService = { get: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenFoodFactsProvider,
        { provide: HttpService, useValue: httpService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    provider = module.get(OpenFoodFactsProvider);
  });

  it('builds the request URL using configured baseUrl and encodes the barcode', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'OPENFOODFACTS_BASE_URL') return 'https://example.com/';
      if (key === 'OPENFOODFACTS_TIMEOUT_MS') return '1234';
      return undefined;
    });

    httpService.get.mockReturnValueOnce(
      of({
        status: 200,
        data: {
          status: 1,
          product: {
            product_name: 'Test Product',
            allergens_tags: [],
            traces_tags: [],
            manufacturing_places_tags: [],
            countries_tags: [],
            languages_hierarchy: [],
            labels_tags: [],
            ingredients_text: '',
            ingredients_tags: [],
          },
        },
      }),
    );

    await provider.lookupProduct('12 34');

    const [url, options] = httpService.get.mock.calls[0];
    expect(url).toBe('https://example.com/api/v2/product/12%2034.json');
    expect(options).toMatchObject({
      timeout: 1234,
      validateStatus: expect.any(Function),
      headers: expect.objectContaining({ Accept: 'application/json' }),
    });
  });

  it('splits ingredients_text into a cleaned list', async () => {
    configService.get.mockReturnValue(undefined);
    httpService.get.mockReturnValueOnce(
      of({
        status: 200,
        data: {
          status: 1,
          product: {
            product_name: 'Test Product',
            ingredients_text: ' sugar, salt , , pepper ',
            ingredients_tags: ['en:ignored'],
            allergens_tags: [1, 'en:milk', null],
            traces_tags: ['en:nuts'],
            manufacturing_places_tags: ['Nigeria'],
            countries_tags: ['USA'],
            languages_hierarchy: ['en:english'],
            labels_tags: ['en:label'],
          },
        },
      }),
    );

    const result = await provider.lookupProduct('123');

    expect(result.ingredients).toEqual(['sugar', 'salt', 'pepper']);
    expect(result.allergens).toEqual(['en:milk']);
  });

  it('falls back to ingredients_tags when ingredients_text is empty', async () => {
    configService.get.mockReturnValue(undefined);
    httpService.get.mockReturnValueOnce(
      of({
        status: 200,
        data: {
          status: 1,
          product: {
            product_name: 'Test Product',
            ingredients_text: '',
            ingredients_tags: ['en:sugar', 'en:salt'],
            allergens_tags: [],
            traces_tags: [],
            manufacturing_places_tags: [],
            countries_tags: [],
            languages_hierarchy: [],
            labels_tags: [],
          },
        },
      }),
    );

    const result = await provider.lookupProduct('123');
    expect(result.ingredients).toEqual(['en:sugar', 'en:salt']);
  });

  it('throws NotFoundException for 404 responses', async () => {
    configService.get.mockReturnValue(undefined);
    httpService.get.mockReturnValueOnce(of({ status: 404, data: {} }));

    await expect(provider.lookupProduct('123')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws ServiceUnavailableException for 5xx responses', async () => {
    configService.get.mockReturnValue(undefined);
    httpService.get.mockReturnValueOnce(of({ status: 503, data: {} }));

    await expect(provider.lookupProduct('123')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('throws BadGatewayException for 4xx (non-404) responses', async () => {
    configService.get.mockReturnValue(undefined);
    httpService.get.mockReturnValueOnce(of({ status: 429, data: {} }));

    await expect(provider.lookupProduct('123')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });
});

