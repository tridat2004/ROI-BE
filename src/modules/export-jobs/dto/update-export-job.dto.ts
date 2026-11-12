import { PartialType } from '@nestjs/mapped-types';
import { CreateExportJobDto } from './create-export-job.dto';

export class UpdateExportJobDto extends PartialType(CreateExportJobDto) {}
