import { Region } from '../../verify/providers/region-inference-provider/region.enums';
import { NormalizedProduct } from '../../verify/providers/region-inference-provider/interface/normalized-product.interface';
import { VerificationResult } from '../contracts/verification-result.interface';

export interface RegulatoryAdapter {
  readonly region: Region;

  verifyProduct(product: NormalizedProduct): Promise<VerificationResult>;
}
