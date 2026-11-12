import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSoftDeleteUser1774236830649 implements MigrationInterface {
    name = 'AddSoftDeleteUser1774236830649'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "is_active" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_active"`);
    }

}
