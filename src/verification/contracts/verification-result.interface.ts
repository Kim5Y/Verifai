import { Region } from '../../verify/providers/region-inference-provider/region.enums';

export type VerificationStatus =
  | 'VERIFIED'
  | 'NOT_FOUND'
  | 'UNSUPPORTED'
  | 'PENDING'
  | 'ERROR';

export interface VerificationResult {
  verified: boolean;

  status: VerificationStatus;

  regulator?: string;

  region?: Region;

  confidence?: number;

  metadata?: Record<string, unknown>;

  warnings?: string[];

  verifiedAt?: string;
}
