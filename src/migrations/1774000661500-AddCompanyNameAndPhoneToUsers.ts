import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCompanyNameAndPhoneToUsers1774000661500 implements MigrationInterface {
    name = 'AddCompanyNameAndPhoneToUsers1774000661500'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "company_name" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "phone" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "company_name"`);
    }

}
