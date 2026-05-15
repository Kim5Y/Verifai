import { Test, TestingModule } from '@nestjs/testing';
import { VerifyService } from './verify.service';
import { OpenFoodFactsProvider } from './providers/openfoodfacts/open-foodfacts.provider';
import { RegionInferenceProvider } from './providers/region-inference-provider/region-inference.provider';

describe('VerifyService', () => {
  let service: VerifyService;
  let openFoodFacts: { lookupProduct: jest.Mock };
  let regionInferenceProvider: { infer: jest.Mock };

  beforeEach(async () => {
    openFoodFacts = {
      lookupProduct: jest.fn(),
    };

    regionInferenceProvider = {
      infer: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerifyService,
        {
          provide: OpenFoodFactsProvider,
          useValue: openFoodFacts,
        },
        {
          provide: RegionInferenceProvider,
          useValue: regionInferenceProvider,
        },
      ],
    }).compile();

    service = module.get<VerifyService>(VerifyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyProduct', () => {
    it('calls lookup -> inference and returns the composed result', async () => {
      openFoodFacts.lookupProduct.mockResolvedValue({
        barcode: '12345678',
        name: 'Test Product',
        brand: 'Test Brand',
        quantity: '100g',
        imageUrl: 'https://example.com/image.jpg',
        nutriments: { salt: 1 },
        ingredients: ['sugar'],
        allergens: ['milk'],
        traces: ['nuts'],
        manufacturingCountries: ['nigeria'],
        purchaseCountries: ['usa'],
        languages: ['english'],
        labels: ['made-in-nigeria'],
        rawSource: 'openfoodfacts',
      });

      regionInferenceProvider.infer.mockReturnValue({
        confidence: { NIGERIA: 1 },
        evidence: [],
      });

      const dto = {
        code: '12345678',
        scannedAt: '2026-05-15T12:34:56.000Z',
      };

      const result = await service.verifyProduct(dto as any);

      expect(openFoodFacts.lookupProduct).toHaveBeenCalledWith('12345678');
      expect(regionInferenceProvider.infer).toHaveBeenCalledTimes(1);

      const inferenceInput = regionInferenceProvider.infer.mock.calls[0]?.[0];
      expect(inferenceInput).toMatchObject({
        barcode: '12345678',
        manufacturingCountries: ['nigeria'],
        purchaseCountries: ['usa'],
        languages: ['english'],
        labels: ['made-in-nigeria'],
        traces: ['nuts'],
        ingredients: ['sugar'],
      });
      expect(inferenceInput).not.toHaveProperty('quantity');
      expect(inferenceInput).not.toHaveProperty('imageUrl');
      expect(inferenceInput).not.toHaveProperty('allergens');
      expect(inferenceInput).not.toHaveProperty('rawSource');

      expect(result).toEqual({
        ...dto,
        getCauntryScore: {
          confidence: { NIGERIA: 1 },
          evidence: [],
        },
      });
    });

    it('propagates provider errors', async () => {
      openFoodFacts.lookupProduct.mockRejectedValueOnce(new Error('boom'));

      await expect(
        service.verifyProduct({
          code: '12345678',
          scannedAt: '2026-05-15T12:34:56.000Z',
        } as any),
      ).rejects.toThrow('boom');
    });
  });
});
