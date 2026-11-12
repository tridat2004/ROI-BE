import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ExportJobsService } from './export-jobs.service';
import { CreateExportJobDto } from './dto/create-export-job.dto';
import { UpdateExportJobDto } from './dto/update-export-job.dto';

import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { ActivityLog } from 'src/common/decorators/activity-log.decorator';

@Controller('export-jobs')
@ActivityLog('Export Jobs Management')
export class ExportJobsController {
  constructor(private readonly exportJobsService: ExportJobsService) {}

  @Post()
  @ActivityLog('Create export report request')
  create(
    @Body() createExportJobDto: CreateExportJobDto,
    @GetUser() user: User,
  ) {
    return this.exportJobsService.create(createExportJobDto, user);
  }

  @Get()
  findAll(@GetUser() user: User) {
    return this.exportJobsService.findAll(user);
  }

  @Get(':id')
  @ActivityLog('View export report status')
  findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.exportJobsService.findOne(+id, user);
  }

  @Patch(':id')
  @ActivityLog('Update export report request')
  update(
    @Param('id') id: string,
    @Body() updateExportJobDto: UpdateExportJobDto,
    @GetUser() user: User,
  ) {
    return this.exportJobsService.update(+id, updateExportJobDto, user);
  }

  @Delete(':id')
  @ActivityLog('Cancel export report request')
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.exportJobsService.remove(+id, user);
  }
}
