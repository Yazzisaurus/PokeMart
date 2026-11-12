import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRawProcessingStatus1794516794401 implements MigrationInterface {
    name = 'AddRawProcessingStatus1794516794401'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "raw_supermarket_rows" ADD "processed_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "raw_supermarket_rows" ADD "processing_error" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "raw_supermarket_rows" DROP COLUMN "processing_error"`);
        await queryRunner.query(`ALTER TABLE "raw_supermarket_rows" DROP COLUMN "processed_at"`);
    }

}
