import { Region } from '../region.enums';

export const languageRules: ReadonlyArray<{
  language: string;
  regions: Region[];
}> = [
  {
    language: 'french',
    regions: [Region.FRANCE, Region.EU, Region.CANADA],
  },
  {
    language: 'english',
    regions: [
      Region.USA,
      Region.UK,
      Region.AUSTRALIA,
      Region.NEW_ZEALAND,
      Region.CANADA,
      Region.NIGERIA,
    ],
  },
  {
    language: 'portuguese',
    regions: [Region.BRAZIL],
  },
  {
    language: 'japanese',
    regions: [Region.JAPAN],
  },
  {
    language: 'hindi',
    regions: [Region.INDIA],
  },
];

