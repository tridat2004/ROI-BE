import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveOpportunityId1773039109094 implements MigrationInterface {
  name = 'RemoveOpportunityId1773039109094';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "roi_projects" DROP COLUMN "opportunity_id"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "roi_projects" ADD "opportunity_id" character varying NOT NULL`,
    );
  }
}
