import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingRelations1773220216278 implements MigrationInterface {
  name = 'AddMissingRelations1773220216278';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP CONSTRAINT "PK_23ed6f04fe43066df08379fd034"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "PK_b23c65e50a758245a33ee35fda1" PRIMARY KEY ("role_id")`,
    );
    await queryRunner.query(`ALTER TABLE "user_roles" DROP COLUMN "user_id"`);
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD "user_id" bigint NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP CONSTRAINT "PK_b23c65e50a758245a33ee35fda1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "PK_23ed6f04fe43066df08379fd034" PRIMARY KEY ("role_id", "user_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "share_links" DROP COLUMN "project_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "share_links" ADD "project_id" bigint`,
    );
    await queryRunner.query(
      `ALTER TABLE "share_links" DROP COLUMN "version_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "share_links" ADD "version_id" bigint`,
    );
    await queryRunner.query(
      `ALTER TABLE "share_links" DROP COLUMN "created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "share_links" ADD "created_by" bigint`,
    );
    await queryRunner.query(
      `ALTER TABLE "export_jobs" DROP COLUMN "project_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "export_jobs" ADD "project_id" bigint`,
    );
    await queryRunner.query(
      `ALTER TABLE "export_jobs" DROP COLUMN "version_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "export_jobs" ADD "version_id" bigint`,
    );
    await queryRunner.query(
      `ALTER TABLE "export_jobs" DROP COLUMN "created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "export_jobs" ADD "created_by" bigint`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "FK_87b8888186ca9769c960e926870" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "FK_b23c65e50a758245a33ee35fda1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "share_links" ADD CONSTRAINT "FK_39f110c1ee38c3db65d0964aaba" FOREIGN KEY ("project_id") REFERENCES "roi_projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "share_links" ADD CONSTRAINT "FK_b14da821d2f0883d72bccce9d62" FOREIGN KEY ("version_id") REFERENCES "roi_project_versions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "share_links" ADD CONSTRAINT "FK_4e055b58ebb5b76da987a770673" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_17022daf3f885f7d35423e9971e" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "export_jobs" ADD CONSTRAINT "FK_0d4f6014807abd0ff584dd018de" FOREIGN KEY ("project_id") REFERENCES "roi_projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "export_jobs" ADD CONSTRAINT "FK_982562ae667de0d8df4ec7de29a" FOREIGN KEY ("version_id") REFERENCES "roi_project_versions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "export_jobs" ADD CONSTRAINT "FK_4ecb252906c0207f0c80fd0fde7" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "export_jobs" DROP CONSTRAINT "FK_4ecb252906c0207f0c80fd0fde7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "export_jobs" DROP CONSTRAINT "FK_982562ae667de0d8df4ec7de29a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "export_jobs" DROP CONSTRAINT "FK_0d4f6014807abd0ff584dd018de"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_17022daf3f885f7d35423e9971e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_178199805b901ccd220ab7740ec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "share_links" DROP CONSTRAINT "FK_4e055b58ebb5b76da987a770673"`,
    );
    await queryRunner.query(
      `ALTER TABLE "share_links" DROP CONSTRAINT "FK_b14da821d2f0883d72bccce9d62"`,
    );
    await queryRunner.query(
      `ALTER TABLE "share_links" DROP CONSTRAINT "FK_39f110c1ee38c3db65d0964aaba"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP CONSTRAINT "FK_b23c65e50a758245a33ee35fda1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP CONSTRAINT "FK_87b8888186ca9769c960e926870"`,
    );
    await queryRunner.query(
      `ALTER TABLE "export_jobs" DROP COLUMN "created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "export_jobs" ADD "created_by" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "export_jobs" DROP COLUMN "version_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "export_jobs" ADD "version_id" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "export_jobs" DROP COLUMN "project_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "export_jobs" ADD "project_id" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "share_links" DROP COLUMN "created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "share_links" ADD "created_by" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "share_links" DROP COLUMN "version_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "share_links" ADD "version_id" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "share_links" DROP COLUMN "project_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "share_links" ADD "project_id" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP CONSTRAINT "PK_23ed6f04fe43066df08379fd034"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "PK_b23c65e50a758245a33ee35fda1" PRIMARY KEY ("role_id")`,
    );
    await queryRunner.query(`ALTER TABLE "user_roles" DROP COLUMN "user_id"`);
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD "user_id" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP CONSTRAINT "PK_b23c65e50a758245a33ee35fda1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "PK_23ed6f04fe43066df08379fd034" PRIMARY KEY ("user_id", "role_id")`,
    );
  }
}
