import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Retailer } from './entities/retailer.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Retailer]),
  ],
})
export class RetailersModule {}
