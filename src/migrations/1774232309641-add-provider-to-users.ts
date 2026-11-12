import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProviderToUsers1774232309641 implements MigrationInterface {
    name = 'AddProviderToUsers1774232309641'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "provider" character varying DEFAULT 'local'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "provider"`);
    }

}
