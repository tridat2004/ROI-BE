import { PartialType } from '@nestjs/mapped-types';
import { CreateRoiCashflowDto } from './create-roi-cashflow.dto';

export class UpdateRoiCashflowDto extends PartialType(CreateRoiCashflowDto) {}
