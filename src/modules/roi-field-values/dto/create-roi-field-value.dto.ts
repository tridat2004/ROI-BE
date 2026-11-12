import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsNumber, Min, ValidateNested } from 'class-validator';

export class RoiFieldValueItemDto {
  @ApiProperty({ description: 'ID of the ROI field' })
  @IsNumber()
  fieldId: number;

  @ApiProperty({ description: 'Value of the ROI field' })
  @IsNumber()
  @Min(0, { message: 'Value must be a positive number' })
  value: number;
}

export class CreateRoiFieldValueDto {
  @ApiProperty({ description: 'ID of the ROI version' })
  @IsNumber()
  versionId: number;

  @ApiProperty({
    description: 'List of ROI field values',
    type: [RoiFieldValueItemDto],
  })
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RoiFieldValueItemDto)
  fields: RoiFieldValueItemDto[];
}
