import { Region } from '../region.enums';

export interface InferenceEvidence {
  region: Region;
  source:
    | 'manufacturing_country'
    | 'purchase_country'
    | 'language'
    | 'label'
    | 'barcode';
  matchedValue: string;
  weight: number;
}
