import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RawSupermarketRow } from './entities/raw-supermarket-row.entity.js';
import { IngestionService } from './ingestion.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RawSupermarketRow,
    ]),
  ],

  providers: [
    IngestionService,
  ],

  exports: [
    IngestionService,
  ],
})
export class IngestionModule {}
