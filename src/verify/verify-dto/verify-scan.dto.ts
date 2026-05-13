import { IsDateString, IsString, Matches } from 'class-validator';

export class VerifyScanDto {
  @IsString()
  @Matches(/^(\d{8}|\d{12}|\d{13}|\d{14})$/, {
    message:
      'code must be a valid barcode format (EAN-8, UPC-A, EAN-13, or GTIN-14)',
  })
  code!: string;

  @IsDateString()
  scannedAt!: string;
}