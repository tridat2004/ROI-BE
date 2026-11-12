import { Module } from '@nestjs/common';
import { RoiScenariosService } from './roi-scenarios.service';
import { RoiScenariosController } from './roi-scenarios.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoiScenario } from './entities/roi-scenario.entity';
import { UserRole } from '../user-roles/entities/user-role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RoiScenario, UserRole])],
  controllers: [RoiScenariosController],
  providers: [RoiScenariosService],
  exports: [RoiScenariosService],
})
export class RoiScenariosModule {}
