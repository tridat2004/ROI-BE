import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { RoiProjectsService } from './src/modules/roi-projects/roi-projects.service';
import { RoiMetricsService } from './src/modules/roi-metrics/roi-metrics.service';

async function verify() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const projectsService = app.get(RoiProjectsService);
  const metricsService = app.get(RoiMetricsService);

  const mockUser = { id: 1 }; // Giả định admin có ID 1

  console.log('--- Kiểm tra findAll ---');
  const findAllRes = await projectsService.findAll(mockUser, 1, 10);
  console.log('Total Items (findAll):', findAllRes.meta.totalItems);

  console.log('\n--- Kiểm tra getProjectMetricsSummary ---');
  const summaryRes = await metricsService.getProjectMetricsSummary(mockUser);
  console.log('Total Projects (summary):', summaryRes.meta.totalProjects);

  if (findAllRes.meta.totalItems === summaryRes.meta.totalProjects) {
    console.log('\n✅ XÁC MINH THÀNH CÔNG: Số lượng khớp nhau!');
  } else {
    console.log('\n❌ XÁC MINH THẤT BẠI: Số lượng không khớp!');
  }

  await app.close();
}

verify().catch(err => {
  console.error(err);
  process.exit(1);
});
