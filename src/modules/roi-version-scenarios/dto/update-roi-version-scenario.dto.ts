import { PartialType } from '@nestjs/mapped-types';
import { CreateRoiVersionScenarioDto } from './create-roi-version-scenario.dto';

export class UpdateRoiVersionScenarioDto extends PartialType(
  CreateRoiVersionScenarioDto,
) {}
