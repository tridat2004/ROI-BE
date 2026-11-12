import { Module } from '@nestjs/common';
import { RoiProjectVersionsService } from './roi-project-versions.service';
import { RoiProjectVersionsController } from './roi-project-versions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoiProjectVersion } from './entities/roi-project-version.entity';
import { UserRole } from '../user-roles/entities/user-role.entity';
import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { AuditModule } from 'src/common/audit.module';
import { RoiProject } from '../roi-projects/entities/roi-project.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoiProjectVersion,
      UserRole,
      Role,
      User,
      RoiProject,
    ]),
    AuditModule,
  ],
  controllers: [RoiProjectVersionsController],
  providers: [RoiProjectVersionsService],
  exports: [RoiProjectVersionsService],
})
export class RoiProjectVersionsModule {}
