import {
  IsString,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateRoiFieldDefinitionDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  group: string;

  @IsString()
  @IsNotEmpty()
  dataType: string;

  @IsBoolean()
  isRequired: boolean;

  @IsOptional()
  defaultValue?: any;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minValue?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxValue?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsString()
  @IsNotEmpty()
  displayName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number;
}
