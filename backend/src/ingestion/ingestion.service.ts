import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createReadStream } from 'node:fs';
import { parse } from 'csv-parse';
import { Repository } from 'typeorm';
import { RawSupermarketRow } from './entities/raw-supermarket-row.entity.js';

type CsvRow = Record<string, string>;

@Injectable()
export class IngestionService {
  constructor(
    @InjectRepository(RawSupermarketRow)
    private readonly rawRepository:
      Repository<RawSupermarketRow>,
  ) {}

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

    const batch: RawSupermarketRow[] = [];

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

      const record = this.rawRepository.create({
        retailer,

        productName,

        category: this.pick(row, [
          'category',
        ]),

        priceRaw: this.pick(row, [
          'price',
          'prices',
        ]),

        unitPriceRaw: this.pick(row, [
          'unit_price',
          'prices_unit',
        ]),

        unitLabel: this.pick(row, [
          'unit',
        ]),

        ownBrandRaw: this.pick(row, [
          'own_brand',
        ]),

        observedDateRaw: this.pick(row, [
          'date',
          'observed_date',
        ]),

        raw: row,
      });

      batch.push(record);
      imported++;

      if (batch.length >= 500) {
        await this.rawRepository.save(batch);
        batch.length = 0;
      }
    }

    if (batch.length > 0) {
      await this.rawRepository.save(batch);
    }

    return imported;
  }

  private pick(
    row: CsvRow,
    keys: string[],
  ): string | undefined {
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
