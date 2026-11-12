import { PartialType } from '@nestjs/mapped-types';
import { CreateRoiScenarioDto } from './create-roi-scenario.dto';

export class UpdateRoiScenarioDto extends PartialType(CreateRoiScenarioDto) {}
