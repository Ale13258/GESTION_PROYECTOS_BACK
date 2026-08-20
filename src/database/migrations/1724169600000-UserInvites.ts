import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserInvites1724169600000 implements MigrationInterface {
  name = 'UserInvites1724169600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "mustSetPassword" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "inviteTokenHash" character varying`);
    await queryRunner.query(`ALTER TABLE "users" ADD "inviteExpiresAt" TIMESTAMP WITH TIME ZONE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "inviteExpiresAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "inviteTokenHash"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "mustSetPassword"`);
  }
}
