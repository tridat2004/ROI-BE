import { Module } from '@nestjs/common';
import { RoiVersionScenariosService } from './roi-version-scenarios.service';
import { RoiVersionScenariosController } from './roi-version-scenarios.controller';
import { RoiVersionScenario } from './entities/roi-version-scenario.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRole } from '../user-roles/entities/user-role.entity';
import { Role } from '../roles/entities/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RoiVersionScenario, UserRole, Role])],
  controllers: [RoiVersionScenariosController],
  providers: [RoiVersionScenariosService],
  exports: [RoiVersionScenariosService],
})
export class RoiVersionScenariosModule {}
