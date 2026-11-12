import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditRelations1773220789367 implements MigrationInterface {
  name = 'AddAuditRelations1773220789367';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // change column type
    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ALTER COLUMN "actor_user_id" TYPE bigint
    `);

    await queryRunner.query(`
      ALTER TABLE "audit_log_changes"
      ALTER COLUMN "audit_log_id" TYPE bigint
    `);

    // add foreign key: audit_logs → users
    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ADD CONSTRAINT "FK_audit_logs_user"
      FOREIGN KEY ("actor_user_id")
      REFERENCES "users"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);

    // add foreign key: audit_log_changes → audit_logs
    await queryRunner.query(`
      ALTER TABLE "audit_log_changes"
      ADD CONSTRAINT "FK_audit_log_changes_log"
      FOREIGN KEY ("audit_log_id")
      REFERENCES "audit_logs"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "audit_log_changes"
      DROP CONSTRAINT "FK_audit_log_changes_log"
    `);

    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      DROP CONSTRAINT "FK_audit_logs_user"
    `);

    await queryRunner.query(`
      ALTER TABLE "audit_log_changes"
      ALTER COLUMN "audit_log_id" TYPE integer
    `);

    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ALTER COLUMN "actor_user_id" TYPE integer
    `);
  }
}
