import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NormalizationModule } from '../normalization/normalization.module.js';
import { RawSupermarketRow } from './entities/raw-supermarket-row.entity.js';
import { IngestionService } from './ingestion.service.js';
import { StagingTransformService } from './staging-transform.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([RawSupermarketRow]), NormalizationModule],
  providers: [IngestionService, StagingTransformService],
  exports: [IngestionService, StagingTransformService],
})
export class IngestionModule {}
