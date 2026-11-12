import { Module } from '@nestjs/common';
import { RoiChartPointsService } from './roi-chart-points.service';
import { RoiChartPointsController } from './roi-chart-points.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoiChartPoint } from './entities/roi-chart-point.entity';
import { UserRole } from '../user-roles/entities/user-role.entity';
import { Role } from '../roles/entities/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RoiChartPoint, UserRole, Role])],
  controllers: [RoiChartPointsController],
  providers: [RoiChartPointsService],
  exports: [RoiChartPointsService],
})
export class RoiChartPointsModule {}
