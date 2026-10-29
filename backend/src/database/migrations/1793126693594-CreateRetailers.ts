import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRetailers1793126693594 implements MigrationInterface {
    name = 'CreateRetailers1793126693594'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "retailers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, CONSTRAINT "UQ_e2bdbb4ec59e476072ea36c5964" UNIQUE ("name"), CONSTRAINT "PK_1228653999402b52e75d40b1c66" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "retailers"`);
    }

}
