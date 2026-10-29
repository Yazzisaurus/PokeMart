import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';

import { RetailerProduct } from '../../products/entities/retailer-product.entity.js';

@Entity('retailers')
export class Retailer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    length: 100,
    unique: true,
  })
  name!: string;

  @OneToMany(
    () => RetailerProduct,
    (product) => product.retailer,
  )
  products!: Relation<RetailerProduct[]>;
}
