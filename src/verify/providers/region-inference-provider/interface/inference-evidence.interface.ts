import { Region } from '../region.enums';

export interface InferenceEvidence {
  region: Region;
  source: string;
  matchedValue: string;
  weight: number;
}