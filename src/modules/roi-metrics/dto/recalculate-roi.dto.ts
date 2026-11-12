// dto/recalculate-roi.dto.ts
import { IsNumber, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FieldValueDto {
  @ApiProperty({ example: 8 })
  @IsNumber()
  fieldId: number;

  @ApiProperty({ example: 1200 })
  @IsNumber()
  value: number;
}

export class RecalculateRoiDto {
  @ApiProperty({ example: 42 })
  @IsNumber()
  versionId: number;

  @ApiProperty({ type: [FieldValueDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldValueDto)
  fields: FieldValueDto[];
}
