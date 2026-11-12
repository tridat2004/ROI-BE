import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreateByAndRemoveRegistrationMethod1774863687347 implements MigrationInterface {
    name = 'AddCreateByAndRemoveRegistrationMethod1774863687347'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_user_roles_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_refresh_tokens_active_user_id"`);
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "registration_method" TO "create_by_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "create_by_id"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "create_by_id" bigint`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_67b362428b8a0b149fda121bf0f" FOREIGN KEY ("create_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_67b362428b8a0b149fda121bf0f"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "create_by_id"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "create_by_id" character varying DEFAULT 'SELF'`);
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "create_by_id" TO "registration_method"`);
        await queryRunner.query(`CREATE INDEX "IDX_refresh_tokens_active_user_id" ON "refresh_tokens" ("user_id") WHERE (is_revoked = false)`);
        await queryRunner.query(`CREATE INDEX "IDX_user_roles_user_id" ON "user_roles" ("user_id") `);
    }

}
