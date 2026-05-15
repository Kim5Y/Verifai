import { RegionInferenceProvider } from './region-inference.provider';
import { Region } from './region.enums';

describe('RegionInferenceProvider', () => {
  let provider: RegionInferenceProvider;

  beforeEach(() => {
    provider = new RegionInferenceProvider();
  });

  it('infers regions from manufacturing and purchase countries with evidence', () => {
    const result = provider.infer({
      barcode: '123',
      name: 'Test Product',
      brand: 'Test Brand',
      manufacturingCountries: [' Nigeria '],
      purchaseCountries: ['USA'],
      languages: [],
      labels: [],
      traces: [],
      ingredients: [],
    });

    expect(result.confidence).toEqual({
      [Region.NIGERIA]: 0.5,
      [Region.USA]: 0.5,
    });

    expect(result.evidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          region: Region.NIGERIA,
          source: 'manufacturing_country',
          matchedValue: ' Nigeria ',
        }),
        expect.objectContaining({
          region: Region.USA,
          source: 'purchase_country',
          matchedValue: 'USA',
        }),
      ]),
    );
  });

  it('returns empty confidence when no signals match', () => {
    const result = provider.infer({
      barcode: '123',
      manufacturingCountries: ['NowhereLand'],
      purchaseCountries: [],
      languages: [],
      labels: [],
      traces: [],
      ingredients: [],
    });

    expect(result.confidence).toEqual({});
    expect(result.evidence).toEqual([]);
  });
});

