import { Type } from 'class-transformer';
import { IsUUID, IsEnum, IsArray, ValidateNested } from 'class-validator';
enum AllergySeverity {
  MILD = 'MILD',
  MODERATE = 'MODERATE',
  SEVERE = 'SEVERE',
}

export class AddUserAllergenDto {
  @IsUUID()
  allergenId: string;

  @IsEnum(AllergySeverity)
  severity: AllergySeverity;
}
export class AddUserAllergiesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddUserAllergenDto)
  allergens: AddUserAllergenDto[];
}