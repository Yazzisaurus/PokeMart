import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePriceObservations1793217272233 implements MigrationInterface {
    name = 'CreatePriceObservations1793217272233'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "price_observations" ("id" BIGSERIAL NOT NULL, "price_minor" integer NOT NULL, "unit_price_minor" integer, "unit_label" character varying(50), "currency" character(3) NOT NULL DEFAULT 'GBP', "observed_date" date NOT NULL, "retailer_product_id" uuid NOT NULL, CONSTRAINT "PK_e6c673b1a567075d17a300a7f71" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_24d6173dd3ea8e137a3baa6f44" ON "price_observations"  ("retailer_product_id", "observed_date") `);
        await queryRunner.query(`ALTER TABLE "price_observations" ADD CONSTRAINT "FK_8c238b27662327c733c9ed120b3" FOREIGN KEY ("retailer_product_id") REFERENCES "retailer_products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "price_observations" DROP CONSTRAINT "FK_8c238b27662327c733c9ed120b3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_24d6173dd3ea8e137a3baa6f44"`);
        await queryRunner.query(`DROP TABLE "price_observations"`);
    }

}
