import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NormalizationModule } from '../normalization/normalization.module.js';
import { CanonicalProduct } from '../products/entities/canonical-product.entity.js';
import { RetailerProduct } from '../products/entities/retailer-product.entity.js';
import { CanonicalAssignmentService } from './canonical-assignment.service.js';
import { ProductMatcherService } from './product-matcher.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([RetailerProduct, CanonicalProduct]),
    NormalizationModule,
  ],
  providers: [ProductMatcherService, CanonicalAssignmentService],
  exports: [ProductMatcherService, CanonicalAssignmentService],
})
export class MatchingModule {}
