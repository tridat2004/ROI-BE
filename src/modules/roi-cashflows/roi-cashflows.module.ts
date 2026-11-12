import { Module } from '@nestjs/common';
import { RoiCashflowsService } from './roi-cashflows.service';
import { RoiCashflowsController } from './roi-cashflows.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoiCashflow } from './entities/roi-cashflow.entity';
import { UserRole } from '../user-roles/entities/user-role.entity';
import { Role } from '../roles/entities/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RoiCashflow, UserRole, Role])],
  controllers: [RoiCashflowsController],
  providers: [RoiCashflowsService],
  exports: [RoiCashflowsService],
})
export class RoiCashflowsModule {}
