import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRelations1773219376078 implements MigrationInterface {
  name = 'AddRelations1773219376078';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "roi_projects" DROP COLUMN "owner_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_projects" ADD "owner_user_id" bigint`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_projects" DROP COLUMN "locked_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_projects" ADD "locked_by" bigint`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_project_versions" DROP COLUMN "project_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_project_versions" ADD "project_id" bigint`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_project_versions" DROP COLUMN "created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_project_versions" ADD "created_by" bigint`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_39b5b141bc76abc8572adfb364"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_version_scenarios" DROP COLUMN "version_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_version_scenarios" ADD "version_id" bigint`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_version_scenarios" ALTER COLUMN "scenario_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0b90a751bdd9fc32701fccd668"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_metrics" DROP COLUMN "version_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_metrics" ADD "version_id" bigint`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_metrics" ALTER COLUMN "scenario_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_field_values" DROP COLUMN "version_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_field_values" ADD "version_id" bigint`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_field_values" ALTER COLUMN "field_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_chart_points" DROP COLUMN "version_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_chart_points" ADD "version_id" bigint`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_chart_points" ALTER COLUMN "scenario_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_00c0e46a853d6a32040a1ab2de"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_cashflows" DROP COLUMN "version_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_cashflows" ADD "version_id" bigint`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_cashflows" ALTER COLUMN "scenario_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_39b5b141bc76abc8572adfb364" ON "roi_version_scenarios" ("version_id", "scenario_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_0b90a751bdd9fc32701fccd668" ON "roi_metrics" ("version_id", "scenario_id", "metric_code") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_00c0e46a853d6a32040a1ab2de" ON "roi_cashflows" ("version_id", "scenario_id", "year_index") `,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_projects" ADD CONSTRAINT "FK_d0c347299ab34e7f892860d8e69" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_projects" ADD CONSTRAINT "FK_18f7080d9efba910b3aa346085f" FOREIGN KEY ("locked_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_project_versions" ADD CONSTRAINT "FK_b684e46f4d65a983967b9eaa045" FOREIGN KEY ("project_id") REFERENCES "roi_projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_project_versions" ADD CONSTRAINT "FK_e2aac247ca204fe15f6f7b08b28" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_version_scenarios" ADD CONSTRAINT "FK_5f6c37f697cd2505c9d652c685f" FOREIGN KEY ("version_id") REFERENCES "roi_project_versions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_version_scenarios" ADD CONSTRAINT "FK_8cf09158c4fe9a138306143ee43" FOREIGN KEY ("scenario_id") REFERENCES "roi_scenarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_metrics" ADD CONSTRAINT "FK_c6760b987a133a131fd181076a3" FOREIGN KEY ("version_id") REFERENCES "roi_project_versions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_metrics" ADD CONSTRAINT "FK_bc9a58d9f984c144db1b8ca4c69" FOREIGN KEY ("scenario_id") REFERENCES "roi_scenarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_field_values" ADD CONSTRAINT "FK_641f313ad85c71b1f825d07eb9c" FOREIGN KEY ("version_id") REFERENCES "roi_project_versions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_field_values" ADD CONSTRAINT "FK_3a2ed007a1d4ad1d1ea384c1866" FOREIGN KEY ("field_id") REFERENCES "roi_field_definitions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_chart_points" ADD CONSTRAINT "FK_74bd03268a61af1d9e0cd3a76c0" FOREIGN KEY ("version_id") REFERENCES "roi_project_versions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_chart_points" ADD CONSTRAINT "FK_962932a827b7a8961cf3153c31c" FOREIGN KEY ("scenario_id") REFERENCES "roi_scenarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_cashflows" ADD CONSTRAINT "FK_07caec4654c010624d660e298c3" FOREIGN KEY ("version_id") REFERENCES "roi_project_versions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_cashflows" ADD CONSTRAINT "FK_d3201fb40a53ccabb132fa9ffbc" FOREIGN KEY ("scenario_id") REFERENCES "roi_scenarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "roi_cashflows" DROP CONSTRAINT "FK_d3201fb40a53ccabb132fa9ffbc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_cashflows" DROP CONSTRAINT "FK_07caec4654c010624d660e298c3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_chart_points" DROP CONSTRAINT "FK_962932a827b7a8961cf3153c31c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_chart_points" DROP CONSTRAINT "FK_74bd03268a61af1d9e0cd3a76c0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_field_values" DROP CONSTRAINT "FK_3a2ed007a1d4ad1d1ea384c1866"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_field_values" DROP CONSTRAINT "FK_641f313ad85c71b1f825d07eb9c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_metrics" DROP CONSTRAINT "FK_bc9a58d9f984c144db1b8ca4c69"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_metrics" DROP CONSTRAINT "FK_c6760b987a133a131fd181076a3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_version_scenarios" DROP CONSTRAINT "FK_8cf09158c4fe9a138306143ee43"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_version_scenarios" DROP CONSTRAINT "FK_5f6c37f697cd2505c9d652c685f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_project_versions" DROP CONSTRAINT "FK_e2aac247ca204fe15f6f7b08b28"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_project_versions" DROP CONSTRAINT "FK_b684e46f4d65a983967b9eaa045"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_projects" DROP CONSTRAINT "FK_18f7080d9efba910b3aa346085f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_projects" DROP CONSTRAINT "FK_d0c347299ab34e7f892860d8e69"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_00c0e46a853d6a32040a1ab2de"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0b90a751bdd9fc32701fccd668"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_39b5b141bc76abc8572adfb364"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_cashflows" ALTER COLUMN "scenario_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_cashflows" DROP COLUMN "version_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_cashflows" ADD "version_id" integer NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_00c0e46a853d6a32040a1ab2de" ON "roi_cashflows" ("version_id", "scenario_id", "year_index") `,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_chart_points" ALTER COLUMN "scenario_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_chart_points" DROP COLUMN "version_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_chart_points" ADD "version_id" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_field_values" ALTER COLUMN "field_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_field_values" DROP COLUMN "version_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_field_values" ADD "version_id" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_metrics" ALTER COLUMN "scenario_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_metrics" DROP COLUMN "version_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_metrics" ADD "version_id" integer NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_0b90a751bdd9fc32701fccd668" ON "roi_metrics" ("version_id", "scenario_id", "metric_code") `,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_version_scenarios" ALTER COLUMN "scenario_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_version_scenarios" DROP COLUMN "version_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_version_scenarios" ADD "version_id" integer NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_39b5b141bc76abc8572adfb364" ON "roi_version_scenarios" ("version_id", "scenario_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_project_versions" DROP COLUMN "created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_project_versions" ADD "created_by" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_project_versions" DROP COLUMN "project_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_project_versions" ADD "project_id" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_projects" DROP COLUMN "locked_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_projects" ADD "locked_by" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_projects" DROP COLUMN "owner_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_projects" ADD "owner_user_id" integer NOT NULL`,
    );
  }
}
