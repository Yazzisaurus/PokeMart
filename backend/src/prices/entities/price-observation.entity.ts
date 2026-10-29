import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';

import { RetailerProduct } from '../../products/entities/retailer-product.entity.js';

@Entity('price_observations')
@Index(['product', 'observedDate'])
export class PriceObservation {
  @PrimaryGeneratedColumn('increment', {
    type: 'bigint',
  })
  id!: string;

  @ManyToOne(
    () => RetailerProduct,
    (product) => product.prices,
    {
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'retailer_product_id',
  })
  product!: Relation<RetailerProduct>;

  @Column({
    name: 'price_minor',
    type: 'integer',
  })
  priceMinor!: number;

  @Column({
    name: 'unit_price_minor',
    type: 'integer',
    nullable: true,
  })
  unitPriceMinor?: number;

  @Column({
    name: 'unit_label',
    length: 50,
    nullable: true,
  })
  unitLabel?: string;

  @Column({
    type: 'char',
    length: 3,
    default: 'GBP',
  })
  currency!: string;

  @Column({
    name: 'observed_date',
    type: 'date',
  })
  observedDate!: string;
}
