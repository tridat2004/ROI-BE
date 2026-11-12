import { PartialType } from '@nestjs/mapped-types';
import { CreateRoiMetricDto } from './create-roi-metric.dto';

export class UpdateRoiMetricDto extends PartialType(CreateRoiMetricDto) {}
