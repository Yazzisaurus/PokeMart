import { Injectable } from '@nestjs/common';
import { createReadStream } from 'node:fs';
import { parse } from 'csv-parse';
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

      const productName = this.pick(row, [
        'product_name',
        'names',
        'name',
        'product',
      ]);

      if (!productName) {
        continue;
      }

      batch.push({
        retailer,

        productName,

        category: this.pick(row, ['category']),

        priceRaw: row.price ?? row.prices ?? row['prices_(£)'] ?? null,

        unitPriceRaw:
          row.unit_price ?? row.prices_unit ?? row['prices_unit_(£)'] ?? null,

        unitLabel: this.pick(row, ['unit']),

        ownBrandRaw: this.pick(row, ['own_brand']),

        observedDateRaw: this.pick(row, ['date', 'observed_date']),

        raw: row,
      });
      imported++;

      if (batch.length >= 500) {
        await this.rawRows.createMany(batch);
        batch.length = 0;
      }
    }

    if (batch.length > 0) {
      await this.rawRows.createMany(batch);
    }

    return imported;
  }

  private pick(row: CsvRow, keys: string[]): string | undefined {
    for (const key of keys) {
      const value = row[key];

      if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ''
      ) {
        return String(value).trim();
      }
    }

    return undefined;
  }
}
