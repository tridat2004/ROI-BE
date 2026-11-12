import { PartialType } from '@nestjs/mapped-types';
import { CreateRoiChartPointDto } from './create-roi-chart-point.dto';

export class UpdateRoiChartPointDto extends PartialType(
  CreateRoiChartPointDto,
) {}
