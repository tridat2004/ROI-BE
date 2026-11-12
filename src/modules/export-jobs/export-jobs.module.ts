import { Module } from '@nestjs/common';
import { ExportJobsService } from './export-jobs.service';
import { ExportJobsController } from './export-jobs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportJob } from './entities/export-job.entity';
import { UserRole } from '../user-roles/entities/user-role.entity';
import { Role } from '../roles/entities/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ExportJob, UserRole, Role])],
  controllers: [ExportJobsController],
  providers: [ExportJobsService],
  exports: [ExportJobsService],
})
export class ExportJobsModule {}
