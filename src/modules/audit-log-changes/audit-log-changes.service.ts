import { Injectable } from '@nestjs/common';
import { CreateAuditLogChangeDto } from './dto/create-audit-log-change.dto';
import { UpdateAuditLogChangeDto } from './dto/update-audit-log-change.dto';

@Injectable()
export class AuditLogChangesService {
  create(createAuditLogChangeDto: CreateAuditLogChangeDto) {
    return 'This action adds a new auditLogChange';
  }

  findAll() {
    return `This action returns all auditLogChanges`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auditLogChange`;
  }

  update(id: number, updateAuditLogChangeDto: UpdateAuditLogChangeDto) {
    return `This action updates a #${id} auditLogChange`;
  }

  remove(id: number) {
    return `This action removes a #${id} auditLogChange`;
  }
}
