import { Injectable } from '@nestjs/common';
import { CreateRoiScenarioDto } from './dto/create-roi-scenario.dto';
import { UpdateRoiScenarioDto } from './dto/update-roi-scenario.dto';

@Injectable()
export class RoiScenariosService {
  create(createRoiScenarioDto: CreateRoiScenarioDto) {
    return 'This action adds a new roiScenario';
  }

  findAll() {
    return `This action returns all roiScenarios`;
  }

  findOne(id: number) {
    return `This action returns a #${id} roiScenario`;
  }

  update(id: number, updateRoiScenarioDto: UpdateRoiScenarioDto) {
    return `This action updates a #${id} roiScenario`;
  }

  remove(id: number) {
    return `This action removes a #${id} roiScenario`;
  }
}
