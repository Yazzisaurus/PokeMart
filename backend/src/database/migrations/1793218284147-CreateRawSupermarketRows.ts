import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRawSupermarketRows1793218284147 implements MigrationInterface {
    name = 'CreateRawSupermarketRows1793218284147'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "raw_supermarket_rows" ("id" BIGSERIAL NOT NULL, "retailer" character varying(100) NOT NULL, "product_name" text NOT NULL, "category" character varying(255), "price_raw" text, "unit_price_raw" text, "unit_label" character varying(100), "own_brand_raw" character varying(50), "observed_date_raw" character varying(100), "raw" jsonb NOT NULL, "imported_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_5e35367b5ab04aabbfe406cad6c" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "raw_supermarket_rows"`);
    }

}
