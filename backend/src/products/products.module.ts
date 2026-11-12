import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RetailerProduct } from './entities/retailer-product.entity.js';
import {  CanonicalProduct, } from './entities/canonical-product.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RetailerProduct,
      CanonicalProduct,
    ]),
  ],
})
export class ProductsModule {}
