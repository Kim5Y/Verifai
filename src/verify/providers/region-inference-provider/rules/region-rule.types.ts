import { Region } from '../region.enums';

export type RegionRule = {
  region: Region;
  keywords: string[];
};

export type BarcodePrefixRule = {
  prefix: string;
  regions: Region[];
};