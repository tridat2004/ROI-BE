import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSoftDeleteFields1773728210889 implements MigrationInterface {
  name = 'AddSoftDeleteFields1773728210889';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_audit_logs_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_log_changes" DROP CONSTRAINT "FK_audit_log_changes_log"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_projects" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_projects" ADD "deleted_by" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_projects" ADD "is_active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_project_versions" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_project_versions" ADD "deleted_by" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_project_versions" ADD "is_active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "share_links" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "share_links" ADD "deleted_by" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "share_links" ADD "is_active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_version_scenarios" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_version_scenarios" ADD "deleted_by" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_version_scenarios" ADD "is_active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_metrics" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_metrics" ADD "deleted_by" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_metrics" ADD "is_active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_field_values" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_field_values" ADD "deleted_by" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_field_values" ADD "is_active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_chart_points" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_chart_points" ADD "deleted_by" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_chart_points" ADD "is_active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_cashflows" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_cashflows" ADD "deleted_by" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_cashflows" ADD "is_active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "export_jobs" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "export_jobs" ADD "deleted_by" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "export_jobs" ADD "is_active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `UPDATE "roi_project_versions" SET "status" = 'draft' WHERE "status" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_project_versions" ALTER COLUMN "status" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ALTER COLUMN "actor_user_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_log_changes" ALTER COLUMN "audit_log_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_f160d97a931844109de9d04228f" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_log_changes" ADD CONSTRAINT "FK_f75fd518f07f77ce7066f105e96" FOREIGN KEY ("audit_log_id") REFERENCES "audit_logs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_log_changes" DROP CONSTRAINT "FK_f75fd518f07f77ce7066f105e96"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_f160d97a931844109de9d04228f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_log_changes" ALTER COLUMN "audit_log_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ALTER COLUMN "actor_user_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_project_versions" ALTER COLUMN "status" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "export_jobs" DROP COLUMN "is_active"`,
    );
    await queryRunner.query(
      `ALTER TABLE "export_jobs" DROP COLUMN "deleted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "export_jobs" DROP COLUMN "deleted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_cashflows" DROP COLUMN "is_active"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_cashflows" DROP COLUMN "deleted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_cashflows" DROP COLUMN "deleted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_chart_points" DROP COLUMN "is_active"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_chart_points" DROP COLUMN "deleted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_chart_points" DROP COLUMN "deleted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_field_values" DROP COLUMN "is_active"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_field_values" DROP COLUMN "deleted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_field_values" DROP COLUMN "deleted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_metrics" DROP COLUMN "is_active"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_metrics" DROP COLUMN "deleted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_metrics" DROP COLUMN "deleted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_version_scenarios" DROP COLUMN "is_active"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_version_scenarios" DROP COLUMN "deleted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_version_scenarios" DROP COLUMN "deleted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "share_links" DROP COLUMN "is_active"`,
    );
    await queryRunner.query(
      `ALTER TABLE "share_links" DROP COLUMN "deleted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "share_links" DROP COLUMN "deleted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_project_versions" DROP COLUMN "is_active"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_project_versions" DROP COLUMN "deleted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_project_versions" DROP COLUMN "deleted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_projects" DROP COLUMN "is_active"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_projects" DROP COLUMN "deleted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roi_projects" DROP COLUMN "deleted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_log_changes" ADD CONSTRAINT "FK_audit_log_changes_log" FOREIGN KEY ("audit_log_id") REFERENCES "audit_logs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_audit_logs_user" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }
}
