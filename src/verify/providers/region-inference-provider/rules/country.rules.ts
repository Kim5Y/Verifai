import { Region } from '../region.enums';
import { RegionRule } from './region-rule.types';

export const countryRules: RegionRule[] = [
  {
    region: Region.NIGERIA,
    keywords: ['nigeria', 'naija', 'lagos', 'abuja'],
  },
  {
    region: Region.USA,
    keywords: [
      'usa',
      'united states',
      'united states of america',
      'america',
      'us',
      'u.s.a',
      'u.s.',
    ],
  },
  {
    region: Region.CANADA,
    keywords: ['canada', 'canadian', 'ontario', 'quebec'],
  },
  {
    region: Region.UK,
    keywords: [
      'uk',
      'united kingdom',
      'britain',
      'great britain',
      'england',
      'scotland',
      'wales',
      'northern ireland',
      'angleterre',
      'royaume-uni',
    ],
  },
  {
    region: Region.FRANCE,
    keywords: ['france', 'french', 'français', 'francais'],
  },
  {
    region: Region.EU,
    keywords: ['eu', 'european union'],
  },
  {
    region: Region.BRAZIL,
    keywords: ['brazil', 'brasil', 'brasileiro'],
  },
  {
    region: Region.INDIA,
    keywords: ['india', 'indian', 'bharat'],
  },
  {
    region: Region.JAPAN,
    keywords: ['japan', 'japanese', 'nippon'],
  },
  {
    region: Region.AUSTRALIA,
    keywords: ['australia', 'australian', 'sydney', 'melbourne'],
  },
  {
    region: Region.NEW_ZEALAND,
    keywords: ['new zealand', 'nz', 'kiwi'],
  },
];

