import { Module } from '@nestjs/common';
import { RoiMetricsService } from './roi-metrics.service';
import { RoiMetricsController } from './roi-metrics.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoiMetric } from './entities/roi-metric.entity';
import { RoiFieldValue } from '../roi-field-values/entities/roi-field-value.entity';
import { RoiVersionScenario } from '../roi-version-scenarios/entities/roi-version-scenario.entity';
import { RoiChartPoint } from '../roi-chart-points/entities/roi-chart-point.entity';
import { RoiCashflow } from '../roi-cashflows/entities/roi-cashflow.entity';
import { RoiProjectVersion } from '../roi-project-versions/entities/roi-project-version.entity';
import { RoiCalculationService } from './roi-calculate.service';
import { AuditModule } from 'src/common/audit.module';
import { UserRole } from '../user-roles/entities/user-role.entity';
import { Role } from '../roles/entities/role.entity';
import { RoiProject } from '../roi-projects/entities/roi-project.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoiFieldValue,
      RoiVersionScenario,
      RoiMetric,
      RoiCashflow,
      RoiChartPoint,
      RoiProjectVersion,
      UserRole,
      Role,
      RoiProject
    ]),
    AuditModule,
  ],
  controllers: [RoiMetricsController],
  providers: [RoiMetricsService, RoiCalculationService],
  exports: [RoiMetricsService],
})
export class RoiMetricsModule {}
