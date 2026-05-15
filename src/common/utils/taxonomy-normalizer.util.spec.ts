import {
  normalizeTaxonomyArray,
  normalizeTaxonomyValue,
} from './taxonomy-normalizer.util';

describe('taxonomy-normalizer.util', () => {
  describe('normalizeTaxonomyValue', () => {
    it('strips taxonomy prefixes and normalizes whitespace', () => {
      expect(normalizeTaxonomyValue('en:nigeria')).toBe('nigeria');
      expect(normalizeTaxonomyValue('fr:ab-agriculture-biologique')).toBe(
        'ab-agriculture-biologique',
      );
      expect(normalizeTaxonomyValue('  en:united_kingdom  ')).toBe(
        'united kingdom',
      );
    });

    it('returns empty string for invalid inputs', () => {
      expect(normalizeTaxonomyValue('')).toBe('');
      expect(normalizeTaxonomyValue('   ')).toBe('');
      expect(normalizeTaxonomyValue(undefined as any)).toBe('');
      expect(normalizeTaxonomyValue(null as any)).toBe('');
    });
  });

  describe('normalizeTaxonomyArray', () => {
    it('normalizes, deduplicates and preserves order', () => {
      expect(
        normalizeTaxonomyArray([
          'en:nigeria',
          'en:english',
          'EN:NIGERIA',
          '  en:english ',
          '',
          null as any,
        ]),
      ).toEqual(['nigeria', 'english']);
    });

    it('returns empty array for undefined/null', () => {
      expect(normalizeTaxonomyArray()).toEqual([]);
      expect(normalizeTaxonomyArray(null)).toEqual([]);
    });
  });
});
