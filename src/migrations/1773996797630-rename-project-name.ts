import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameProjectName1773996797630 implements MigrationInterface {
    name = 'RenameProjectName1773996797630'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "roi_projects" RENAME COLUMN "code" TO "projectName"`);
        await queryRunner.query(`ALTER TABLE "roi_projects" RENAME CONSTRAINT "UQ_8f65ce056830c382c2167251420" TO "UQ_392b71f98d6a8adc6b919f93c5b"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "roi_projects" RENAME CONSTRAINT "UQ_392b71f98d6a8adc6b919f93c5b" TO "UQ_8f65ce056830c382c2167251420"`);
        await queryRunner.query(`ALTER TABLE "roi_projects" RENAME COLUMN "projectName" TO "code"`);
    }

}
