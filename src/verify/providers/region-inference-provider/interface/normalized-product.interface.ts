export interface NormalizedProduct {
  barcode: string;
  name?: string;
  brand?: string;
  manufacturingCountries: string[];
  purchaseCountries: string[];
  languages: string[];
  labels: string[];
  traces: string[];
  ingredients: string[];
}
