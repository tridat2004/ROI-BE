import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';

/* =========================
   MODULES
========================= */

import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { RolePermissionsModule } from './modules/role-permissions/role-permissions.module';
import { UserRolesModule } from './modules/user-roles/user-roles.module';

import { RoiProjectsModule } from './modules/roi-projects/roi-projects.module';
import { RoiProjectVersionsModule } from './modules/roi-project-versions/roi-project-versions.module';
import { RoiFieldDefinitionsModule } from './modules/roi-field-definitions/roi-field-definitions.module';
import { RoiFieldValuesModule } from './modules/roi-field-values/roi-field-values.module';

import { RoiScenariosModule } from './modules/roi-scenarios/roi-scenarios.module';
import { RoiVersionScenariosModule } from './modules/roi-version-scenarios/roi-version-scenarios.module';

import { RoiMetricsModule } from './modules/roi-metrics/roi-metrics.module';
import { RoiCashflowsModule } from './modules/roi-cashflows/roi-cashflows.module';
import { RoiChartPointsModule } from './modules/roi-chart-points/roi-chart-points.module';

import { ShareLinksModule } from './modules/share-links/share-links.module';
import { ExportJobsModule } from './modules/export-jobs/export-jobs.module';

import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { AuditLogChangesModule } from './modules/audit-log-changes/audit-log-changes.module';
import { AuthModule } from './modules/auth/auth.module';
import { ActivityLogsModule } from './modules/activity-logs/activity-logs.module';
import { AuditModule } from './common/audit.module';
import { AuditService } from './common/audit.service';
import { ActivityLogInterceptor } from './common/interceptors/activity-log.interceptor';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';

@Module({
  imports: [
    /* =========================
       ENV CONFIG
    ========================= */

    ConfigModule.forRoot({
      isGlobal: true,
    }),

    /* =========================
       DB - POSTGRES (ROI)
    ========================= */

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: Number(config.get('DB_PORT')),
        username: config.get('DB_USER'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),

    /* =========================
       MODULES
    ========================= */

    UsersModule,
    RolesModule,
    PermissionsModule,
    RolePermissionsModule,
    UserRolesModule,

    RoiProjectsModule,
    RoiProjectVersionsModule,
    RoiFieldDefinitionsModule,
    RoiFieldValuesModule,

    RoiScenariosModule,
    RoiVersionScenariosModule,

    RoiMetricsModule,
    RoiCashflowsModule,
    RoiChartPointsModule,

    ShareLinksModule,
    ExportJobsModule,

    AuditLogsModule,
    AuditLogChangesModule,
    AuthModule,
    AuditModule,
    ActivityLogsModule,
    ScheduleModule.forRoot(),
  ],

  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_INTERCEPTOR, useClass: ActivityLogInterceptor },
  ],
})
export class AppModule {}
