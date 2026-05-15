import { RegionConfidenceMap } from '../region.types';
import { InferenceEvidence } from './inference-evidence.interface';

export interface InferenceResult {
  confidence: RegionConfidenceMap;

  evidence: InferenceEvidence[];
}