import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';

import { Retailer } from '../../retailers/entities/retailer.entity.js';
import { PriceObservation } from '../../prices/entities/price-observation.entity.js';
import {  CanonicalProduct, } from './canonical-product.entity.js';

@Entity('retailer_products')
export class RetailerProduct {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(
    () => CanonicalProduct,
    (canonicalProduct) =>
      canonicalProduct.retailerProducts,
    {
      nullable: true,
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({
    name: 'canonical_product_id',
  })
  canonicalProduct!: CanonicalProduct | null;

  @Column({
    name: 'match_method',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  matchMethod!: string | null;

  @Column({
    name: 'match_confidence',
    type: 'real',
    nullable: true,
  })
  matchConfidence!: number | null;

  @ManyToOne(
    () => Retailer,
    (retailer) => retailer.products,
    {
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'retailer_id',
  })
  retailer!: Relation<Retailer>;

  @Column({
    name: 'source_name',
    length: 500,
  })
  sourceName!: string;

  @Column({
    name: 'normalized_name',
    length: 500,
  })
  normalizedName!: string;

  @Column({
    name: 'own_brand',
    default: false,
  })
  ownBrand!: boolean;

  @Column({
    name: 'source_product_id',
    length: 255,
    nullable: true,
  })
  sourceProductId?: string;

  @OneToMany(
    () => PriceObservation,
    (price) => price.product,
  )
  prices!: Relation<PriceObservation[]>;
}
