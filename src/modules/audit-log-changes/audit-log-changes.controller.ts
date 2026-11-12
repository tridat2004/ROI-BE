import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AuditLogChangesService } from './audit-log-changes.service';
import { CreateAuditLogChangeDto } from './dto/create-audit-log-change.dto';
import { UpdateAuditLogChangeDto } from './dto/update-audit-log-change.dto';

import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles, AppRole } from 'src/common/decorators/roles.decorator';
import { UseGuards } from '@nestjs/common';

@Controller('audit-log-changes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AppRole.ADMIN, AppRole.MANAGER)
export class AuditLogChangesController {
  constructor(
    private readonly auditLogChangesService: AuditLogChangesService,
  ) {}

  @Post()
  create(@Body() createAuditLogChangeDto: CreateAuditLogChangeDto) {
    return this.auditLogChangesService.create(createAuditLogChangeDto);
  }

  @Get()
  findAll() {
    return this.auditLogChangesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.auditLogChangesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAuditLogChangeDto: UpdateAuditLogChangeDto,
  ) {
    return this.auditLogChangesService.update(+id, updateAuditLogChangeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.auditLogChangesService.remove(+id);
  }
}
