import { PartialType } from '@nestjs/mapped-types';
import { CreateAuditLogChangeDto } from './create-audit-log-change.dto';

export class UpdateAuditLogChangeDto extends PartialType(
  CreateAuditLogChangeDto,
) {}
