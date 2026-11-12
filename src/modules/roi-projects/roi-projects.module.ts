import { Module } from '@nestjs/common';
import { RoiProjectsService } from './roi-projects.service';
import { RoiProjectsController } from './roi-projects.controller';
import { RoiProject } from './entities/roi-project.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoiProjectVersion } from '../roi-project-versions/entities/roi-project-version.entity';
import { RoiVersionScenario } from '../roi-version-scenarios/entities/roi-version-scenario.entity';
import { RoiScenario } from '../roi-scenarios/entities/roi-scenario.entity';
import { AuditModule } from 'src/common/audit.module';
import { UserRole } from '../user-roles/entities/user-role.entity';
import { Role } from '../roles/entities/role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoiProject,
      RoiProjectVersion,
      RoiVersionScenario,
      RoiScenario,
      UserRole,
      Role,
    ]),
    AuditModule,
  ],
  controllers: [RoiProjectsController],
  providers: [RoiProjectsService],
})
export class RoiProjectsModule {}
