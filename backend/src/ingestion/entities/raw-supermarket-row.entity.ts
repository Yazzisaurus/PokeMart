import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('raw_supermarket_rows')
export class RawSupermarketRow {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
  })
  id!: string;

  @Column({
    length: 100,
  })
  retailer!: string;

  @Column({
    name: 'product_name',
    type: 'text',
  })
  productName!: string;

  @Column({
    length: 255,
    nullable: true,
  })
  category?: string;

  @Column({
    name: 'price_raw',
    type: 'text',
    nullable: true,
  })
  priceRaw?: string;

  @Column({
    name: 'unit_price_raw',
    type: 'text',
    nullable: true,
  })
  unitPriceRaw?: string;

  @Column({
    name: 'unit_label',
    length: 100,
    nullable: true,
  })
  unitLabel?: string;

  @Column({
    name: 'own_brand_raw',
    length: 50,
    nullable: true,
  })
  ownBrandRaw?: string;

  @Column({
    name: 'observed_date_raw',
    length: 100,
    nullable: true,
  })
  observedDateRaw?: string;

  @Column({
    type: 'jsonb',
  })
  raw!: Record<string, unknown>;

  @CreateDateColumn({
    name: 'imported_at',
    type: 'timestamptz',
  })
  importedAt!: Date;
}
