import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import {
  RetailerProduct,
} from './retailer-product.entity.js';

@Entity({
  name: 'canonical_products',
})
@Index([
  'normalizedName',
  'category',
])
export class CanonicalProduct {

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'display_name',
    type: 'varchar',
    length: 500,
  })
  displayName!: string;

  @Column({
    name: 'normalized_name',
    type: 'varchar',
    length: 500,
  })
  normalizedName!: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  category!: string | null;

  @Column({
    name: 'quantity_value',
    type: 'integer',
    nullable: true,
  })
  quantityValue!: number | null;

  @Column({
    name: 'quantity_unit',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  quantityUnit!: string | null;

  @OneToMany(
    () => RetailerProduct,
    (product) =>
      product.canonicalProduct,
  )
  retailerProducts!: RetailerProduct[];

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt!: Date;
}
