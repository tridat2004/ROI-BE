import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1772816947764 implements MigrationInterface {
  name = 'Init1772816947764';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" BIGSERIAL NOT NULL, "email" character varying NOT NULL, "full_name" character varying, "password_hash" character varying, "status" character varying, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "roles" ("id" SERIAL NOT NULL, "code" character varying NOT NULL, "name" character varying NOT NULL, CONSTRAINT "UQ_f6d54f95c31b73fb1bdd8e91d0c" UNIQUE ("code"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_roles" ("user_id" integer NOT NULL, "role_id" integer NOT NULL, CONSTRAINT "PK_23ed6f04fe43066df08379fd034" PRIMARY KEY ("user_id", "role_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "roi_scenarios" ("id" SMALLSERIAL NOT NULL, "code" character varying NOT NULL, "name" character varying NOT NULL, "default_workforce_reduction" numeric, CONSTRAINT "UQ_aacc0681acc5d435d0f1417c523" UNIQUE ("code"), CONSTRAINT "PK_fed290952d046105cbb3589add4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "role_permissions" ("role_id" integer NOT NULL, "permission_id" integer NOT NULL, CONSTRAINT "PK_25d24010f53bb80b78e412c9656" PRIMARY KEY ("role_id", "permission_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "roi_projects" ("id" BIGSERIAL NOT NULL, "code" character varying NOT NULL, "customer_name" character varying NOT NULL, "opportunity_id" character varying NOT NULL, "industry" character varying NOT NULL, "owner_user_id" integer NOT NULL, "status" character varying NOT NULL, "locked_at" TIMESTAMP WITH TIME ZONE, "locked_by" integer, "current_version_id" integer, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_8f65ce056830c382c2167251420" UNIQUE ("code"), CONSTRAINT "PK_c7ebc2c4d18a74d30b78d9982f2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "roi_project_versions" ("id" BIGSERIAL NOT NULL, "project_id" integer NOT NULL, "version_no" integer NOT NULL, "title" character varying NOT NULL, "created_by" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "is_locked_snapshot" boolean NOT NULL, "calculation_model_version" character varying NOT NULL, CONSTRAINT "PK_f4833d1717d315060442b0daf2f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "roi_version_scenarios" ("id" BIGSERIAL NOT NULL, "version_id" integer NOT NULL, "scenario_id" smallint NOT NULL, "workforce_reduction" numeric, "throughput_multiplier" numeric, CONSTRAINT "PK_f8d0640b9c9bf6fc43d05d139e2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_39b5b141bc76abc8572adfb364" ON "roi_version_scenarios" ("version_id", "scenario_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "roi_metrics" ("id" BIGSERIAL NOT NULL, "version_id" integer NOT NULL, "scenario_id" smallint NOT NULL, "metric_code" character varying NOT NULL, "value_numeric" numeric, "value_text" text, "currency" character varying, CONSTRAINT "PK_4c58c2d9f4b2871023a51026dc5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_0b90a751bdd9fc32701fccd668" ON "roi_metrics" ("version_id", "scenario_id", "metric_code") `,
    );
    await queryRunner.query(
      `CREATE TABLE "share_links" ("id" BIGSERIAL NOT NULL, "project_id" integer NOT NULL, "version_id" integer, "token_hash" character varying NOT NULL, "scope" character varying NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE, "created_by" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "revoked_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_9e5c29ce5b3cab482e85d7f8138" UNIQUE ("token_hash"), CONSTRAINT "PK_70320b79ecd8acab96419fcdd6d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "roi_field_definitions" ("id" SERIAL NOT NULL, "code" character varying NOT NULL, "group" character varying NOT NULL, "data_type" character varying NOT NULL, "is_required" boolean NOT NULL, "default_value" json, "min_value" numeric, "max_value" numeric, "unit" character varying, "display_name" character varying NOT NULL, "description" text, "sort_order" integer, CONSTRAINT "UQ_00fb225ccca136fada976749607" UNIQUE ("code"), CONSTRAINT "PK_f9c724b2850d97dea0ca8541347" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "roi_chart_points" ("id" BIGSERIAL NOT NULL, "version_id" integer NOT NULL, "scenario_id" smallint NOT NULL, "chart_code" character varying NOT NULL, "x_key" character varying NOT NULL, "y_value" numeric, "meta" json, CONSTRAINT "PK_d37e903da56f7a74ba0db995701" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "roi_field_values" ("id" BIGSERIAL NOT NULL, "version_id" integer NOT NULL, "field_id" integer NOT NULL, "value_numeric" numeric, "value_text" text, "value_bool" boolean, "value_json" json, "is_estimated" boolean NOT NULL, "source" character varying NOT NULL, CONSTRAINT "PK_76cbec5727e19aae91a98a446f9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "roi_cashflows" ("id" BIGSERIAL NOT NULL, "version_id" integer NOT NULL, "scenario_id" smallint NOT NULL, "year_index" integer NOT NULL, "savings" numeric, "costs" numeric, "net" numeric, CONSTRAINT "PK_b48ac7be46420aab1723368b7ba" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_00c0e46a853d6a32040a1ab2de" ON "roi_cashflows" ("version_id", "scenario_id", "year_index") `,
    );
    await queryRunner.query(
      `CREATE TABLE "permissions" ("id" SERIAL NOT NULL, "code" character varying NOT NULL, CONSTRAINT "UQ_8dad765629e83229da6feda1c1d" UNIQUE ("code"), CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "export_jobs" ("id" BIGSERIAL NOT NULL, "project_id" integer NOT NULL, "version_id" integer, "export_type" character varying NOT NULL, "status" character varying NOT NULL, "file_url" text, "created_by" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "finished_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_3044ce6f1c6af24058ee609e063" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "audit_logs" ("id" BIGSERIAL NOT NULL, "actor_user_id" integer NOT NULL, "action" character varying NOT NULL, "entity_type" character varying NOT NULL, "entity_id" integer NOT NULL, "occurred_at" TIMESTAMP WITH TIME ZONE NOT NULL, "ip" character varying, "user_agent" text, CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "audit_log_changes" ("id" BIGSERIAL NOT NULL, "audit_log_id" integer NOT NULL, "field_code" character varying NOT NULL, "old_value" json, "new_value" json, CONSTRAINT "PK_836f32755f4a97d231de0fbb6e3" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "audit_log_changes"`);
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TABLE "export_jobs"`);
    await queryRunner.query(`DROP TABLE "permissions"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_00c0e46a853d6a32040a1ab2de"`,
    );
    await queryRunner.query(`DROP TABLE "roi_cashflows"`);
    await queryRunner.query(`DROP TABLE "roi_field_values"`);
    await queryRunner.query(`DROP TABLE "roi_chart_points"`);
    await queryRunner.query(`DROP TABLE "roi_field_definitions"`);
    await queryRunner.query(`DROP TABLE "share_links"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0b90a751bdd9fc32701fccd668"`,
    );
    await queryRunner.query(`DROP TABLE "roi_metrics"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_39b5b141bc76abc8572adfb364"`,
    );
    await queryRunner.query(`DROP TABLE "roi_version_scenarios"`);
    await queryRunner.query(`DROP TABLE "roi_project_versions"`);
    await queryRunner.query(`DROP TABLE "roi_projects"`);
    await queryRunner.query(`DROP TABLE "role_permissions"`);
    await queryRunner.query(`DROP TABLE "roi_scenarios"`);
    await queryRunner.query(`DROP TABLE "user_roles"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
