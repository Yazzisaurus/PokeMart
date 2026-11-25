import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRetailerProducts1793195950302 implements MigrationInterface {
    name = 'CreateRetailerProducts1793195950302'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "retailer_products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "source_name" character varying(500) NOT NULL, "normalized_name" character varying(500) NOT NULL, "own_brand" boolean NOT NULL DEFAULT false, "source_product_id" character varying(255), "retailer_id" uuid NOT NULL, CONSTRAINT "PK_a5a8ec42a7aa064d73b7fd67fc1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "retailer_products" ADD CONSTRAINT "FK_5fd16daf4fe9bc45e7937fce0ea" FOREIGN KEY ("retailer_id") REFERENCES "retailers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "retailer_products" DROP CONSTRAINT "FK_5fd16daf4fe9bc45e7937fce0ea"`);
        await queryRunner.query(`DROP TABLE "retailer_products"`);
    }

}
