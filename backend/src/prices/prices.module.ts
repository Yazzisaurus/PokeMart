import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PriceObservation } from './entities/price-observation.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PriceObservation,
    ]),
  ],
})
export class PricesModule {}
