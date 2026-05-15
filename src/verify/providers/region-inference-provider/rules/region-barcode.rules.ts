import { Region } from '../region.enums';
export const BARCODE_PREFIX_TO_REGION_RULES: ReadonlyArray<{
  prefix: string;
  regions: ReadonlyArray<Region>;
}> = [
  { prefix: '50', regions: [Region.UK] },
  { prefix: '30', regions: [Region.FRANCE] },
  { prefix: '60', regions: [Region.NIGERIA] },
  { prefix: '00', regions: [Region.USA] },
  { prefix: '01', regions: [Region.USA] },
  { prefix: '02', regions: [Region.USA] },
  { prefix: '03', regions: [Region.USA] },
  { prefix: '04', regions: [Region.USA] },
  { prefix: '05', regions: [Region.USA] },
  { prefix: '06', regions: [Region.USA] },
  { prefix: '07', regions: [Region.USA] },
  { prefix: '08', regions: [Region.USA] },
  { prefix: '09', regions: [Region.USA] },
] as const;
