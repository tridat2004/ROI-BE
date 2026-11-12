import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRegistrationMethodToUser1774496225422 implements MigrationInterface {
    name = 'AddRegistrationMethodToUser1774496225422'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD COLUMN "registration_method" varchar DEFAULT 'SELF'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users"
            DROP COLUMN "registration_method"
        `);
    }
}