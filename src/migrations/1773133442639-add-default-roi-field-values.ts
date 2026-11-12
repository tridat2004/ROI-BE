import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateNullableRoiFieldValues1773135000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE roi_field_values
      ALTER COLUMN is_estimated DROP NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE roi_field_values
      ALTER COLUMN source DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE roi_field_values
      ALTER COLUMN is_estimated SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE roi_field_values
      ALTER COLUMN source SET NOT NULL
    `);
  }
}
