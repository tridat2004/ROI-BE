import { Module } from '@nestjs/common';
import { RoiFieldDefinitionsService } from './roi-field-definitions.service';
import { RoiFieldDefinitionsController } from './roi-field-definitions.controller';
import { RoiFieldDefinition } from './entities/roi-field-definition.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRole } from '../user-roles/entities/user-role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RoiFieldDefinition, UserRole])],
  controllers: [RoiFieldDefinitionsController],
  providers: [RoiFieldDefinitionsService],
  exports: [RoiFieldDefinitionsService],
})
export class RoiFieldDefinitionsModule {}
