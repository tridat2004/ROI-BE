import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStatusToRoiProjectVersions1773291685556 implements MigrationInterface {
  name = 'AddStatusToRoiProjectVersions1773291685556';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "roi_project_versions"
      ADD COLUMN "status" varchar
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "roi_project_versions"
      DROP COLUMN "status"
    `);
  }
}
