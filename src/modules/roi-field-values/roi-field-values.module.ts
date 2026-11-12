import { Module } from '@nestjs/common';
import { RoiFieldValuesService } from './roi-field-values.service';
import { RoiFieldValuesController } from './roi-field-values.controller';
import { RoiFieldValue } from './entities/roi-field-value.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoiFieldDefinition } from '../roi-field-definitions/entities/roi-field-definition.entity';
import { UserRole } from '../user-roles/entities/user-role.entity';
import { Role } from '../roles/entities/role.entity';
import { RoiProjectVersion } from '../roi-project-versions/entities/roi-project-version.entity';
import { AuditModule } from 'src/common/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoiFieldValue,
      RoiFieldDefinition,
      RoiProjectVersion,
      UserRole,
      Role,
    ]),
    AuditModule,
  ],
  controllers: [RoiFieldValuesController],
  providers: [RoiFieldValuesService],
  exports: [RoiFieldValuesService],
})
export class RoiFieldValuesModule {}
