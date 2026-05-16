import { Region } from '../region.enums';
import { RegionRule } from './region-rule.types';

export const labelRules: RegionRule[] = [
  {
    region: Region.EU,
    keywords: [
      'eu-organic',
      'eu-agriculture',
      'eu-non-eu-agriculture',
      'certified-by-ecocert',
    ],
  },
  {
    region: Region.UK,
    keywords: ['gb-org', 'soil-association-organic'],
  },
  {
    region: Region.FRANCE,
    keywords: ['fr-bio', 'ab-agriculture-biologique'],
  },
  {
    region: Region.CANADA,
    keywords: ['canada-organic'],
  },
  {
    region: Region.USA,
    keywords: ['usda-organic', 'fda'],
  },
  {
    region: Region.AUSTRALIA,
    keywords: ['australian-made'],
  },
  {
    region: Region.BRAZIL,
    keywords: ['anvisa'],
  },
  {
    region: Region.INDIA,
    keywords: ['fssai'],
  },
  {
    region: Region.NIGERIA,
    keywords: ['nafdac'],
  },
  {
    region: Region.JAPAN,
    keywords: ['jas-organic'],
  },
];

