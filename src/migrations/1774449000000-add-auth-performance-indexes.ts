import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthPerformanceIndexes1774449000000 implements MigrationInterface {
  name = 'AddAuthPerformanceIndexes1774449000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_user_roles_user_id" ON "user_roles" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_refresh_tokens_active_user_id" ON "refresh_tokens" ("user_id") WHERE "is_revoked" = false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_refresh_tokens_active_user_id"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_roles_user_id"`);
  }
}
