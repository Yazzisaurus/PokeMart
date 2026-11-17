import { Module } from '@nestjs/common';

import { IngestionService } from './ingestion.service.js';
import { RawSupermarketRowRepository } from './raw-supermarket-row.repository.js';

@Module({
  providers: [IngestionService, RawSupermarketRowRepository],
  exports: [IngestionService, RawSupermarketRowRepository],
})
export class IngestionModule {}
