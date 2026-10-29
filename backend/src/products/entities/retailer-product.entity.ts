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

@Entity('retailer_products')
export class RetailerProduct {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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
