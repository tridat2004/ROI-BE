import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateActivityLog1774428996352 implements MigrationInterface {
    name = 'CreateActivityLog1774428996352'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "activity_log" ("id" BIGSERIAL NOT NULL, "user_id" bigint NOT NULL, "username" character varying, "action" character varying NOT NULL, "ip" character varying, "status" character varying, "create_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "desc" text, CONSTRAINT "PK_067d761e2956b77b14e534fd6f1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "activity_log" ADD CONSTRAINT "FK_81615294532ca4b6c70abd1b2e6" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activity_log" DROP CONSTRAINT "FK_81615294532ca4b6c70abd1b2e6"`);
        await queryRunner.query(`DROP TABLE "activity_log"`);
    }

}
