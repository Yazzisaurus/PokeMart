import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RetailerProduct } from './entities/retailer-product.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RetailerProduct,
    ]),
  ],
})
export class ProductsModule {}
