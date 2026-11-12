import { MigrationInterface, QueryRunner } from "typeorm";

export class FixProjectNameUniqueConstraint1774927613304 implements MigrationInterface {
    name = 'FixProjectNameUniqueConstraint1774927613304'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "roi_projects" DROP CONSTRAINT "UQ_392b71f98d6a8adc6b919f93c5b"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_projectName_isActive" ON "roi_projects" ("projectName") WHERE "is_active" = true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."UQ_projectName_isActive"`);
        await queryRunner.query(`ALTER TABLE "roi_projects" ADD CONSTRAINT "UQ_392b71f98d6a8adc6b919f93c5b" UNIQUE ("projectName")`);
    }

}
