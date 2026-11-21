import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCanonicalProducts1794237839341 implements MigrationInterface {
    name = 'CreateCanonicalProducts1794237839341'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "canonical_products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "display_name" character varying(500) NOT NULL, "normalized_name" character varying(500) NOT NULL, "category" character varying(255), "quantity_value" integer, "quantity_unit" character varying(20), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_057e93011fde3ff01251c3516a1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b964e6435ffbaf7c4c0250a65c" ON "canonical_products"  ("normalized_name", "category") `);
        await queryRunner.query(`ALTER TABLE "retailer_products" ADD "match_method" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "retailer_products" ADD "match_confidence" real`);
        await queryRunner.query(`ALTER TABLE "retailer_products" ADD "canonical_product_id" uuid`);
        await queryRunner.query(`ALTER TABLE "retailer_products" ADD CONSTRAINT "FK_94cd20d81fc94068bdec7c97817" FOREIGN KEY ("canonical_product_id") REFERENCES "canonical_products"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "retailer_products" DROP CONSTRAINT "FK_94cd20d81fc94068bdec7c97817"`);
        await queryRunner.query(`ALTER TABLE "retailer_products" DROP COLUMN "canonical_product_id"`);
        await queryRunner.query(`ALTER TABLE "retailer_products" DROP COLUMN "match_confidence"`);
        await queryRunner.query(`ALTER TABLE "retailer_products" DROP COLUMN "match_method"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b964e6435ffbaf7c4c0250a65c"`);
        await queryRunner.query(`DROP TABLE "canonical_products"`);
    }

}
