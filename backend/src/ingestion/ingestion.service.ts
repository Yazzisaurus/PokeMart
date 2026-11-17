import { Injectable } from '@nestjs/common';
import { createReadStream } from 'node:fs';
import { parse } from 'csv-parse';
import {
  INGESTION_BATCH_SIZE,
  INGESTION_CSV_CATEGORY_COLUMNS,
  INGESTION_CSV_OBSERVED_DATE_COLUMNS,
  INGESTION_CSV_OWN_BRAND_COLUMNS,
  INGESTION_CSV_PRICE_COLUMNS,
  INGESTION_CSV_PRODUCT_NAME_COLUMNS,
  INGESTION_CSV_UNIT_COLUMNS,
  INGESTION_CSV_UNIT_PRICE_COLUMNS,
} from './ingestion.constants.js';
import type { RawSupermarketRowInsert } from './ingestion.types.js';
import { RawSupermarketRowRepository } from './raw-supermarket-row.repository.js';

type CsvRow = Record<string, string>;
@Injectable()
export class IngestionService {
  constructor(private readonly rawRows: RawSupermarketRowRepository) {}

  async importCsv(
    filePath: string,
    retailer: string,
    limit?: number,
  ): Promise<number> {
    const parser = createReadStream(filePath).pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }),
    );
    const batch: RawSupermarketRowInsert[] = [];
    let imported = 0;
    for await (const row of parser as AsyncIterable<CsvRow>) {
      if (limit && imported >= limit) {
        break;
      }
      const productName = this.pick(row, INGESTION_CSV_PRODUCT_NAME_COLUMNS);
      if (!productName) {
        continue;
      }
      batch.push({
        retailer,
        productName,
        category: this.pick(row, INGESTION_CSV_CATEGORY_COLUMNS),
        priceRaw: this.firstPresent(row, INGESTION_CSV_PRICE_COLUMNS),
        unitPriceRaw: this.firstPresent(row, INGESTION_CSV_UNIT_PRICE_COLUMNS),
        unitLabel: this.pick(row, INGESTION_CSV_UNIT_COLUMNS),
        ownBrandRaw: this.pick(row, INGESTION_CSV_OWN_BRAND_COLUMNS),
        observedDateRaw: this.pick(row, INGESTION_CSV_OBSERVED_DATE_COLUMNS),
        raw: row,
      });
      imported++;
      if (batch.length >= INGESTION_BATCH_SIZE) {
        await this.rawRows.createMany(batch);
        batch.length = 0;
      }
    }
    if (batch.length > 0) {
      await this.rawRows.createMany(batch);
    }
    return imported;
  }

  private pick(row: CsvRow, keys: readonly string[]): string | undefined {
    for (const key of keys) {
      const value = row[key];
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        return String(value).trim();
      }
    }
    return undefined;
  }

  private firstPresent(row: CsvRow, keys: readonly string[]): string | null {
    for (const key of keys) {
      const value = row[key];
      if (value !== undefined && value !== null) {
        return value;
      }
    }
    return null;
  }
}
