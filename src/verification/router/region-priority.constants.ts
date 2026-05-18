import { Region } from '../../verify/providers/region-inference-provider/region.enums';

export const REGION_PRIORITY: Readonly<Record<Region, number>> = {
  [Region.USA]: 100,
  [Region.CANADA]: 100,
  [Region.UK]: 100,
  [Region.NIGERIA]: 100,
  [Region.JAPAN]: 100,
  [Region.BRAZIL]: 100,
  [Region.INDIA]: 100,
  [Region.AUSTRALIA]: 100,
  [Region.NEW_ZEALAND]: 100,
  [Region.FRANCE]: 100,
  [Region.EU]: 50,
};

export const REGION_FALLBACKS: Readonly<Partial<Record<Region, readonly Region[]>>> =
  {
    [Region.FRANCE]: [Region.EU],
    [Region.UK]: [Region.EU],
  };
