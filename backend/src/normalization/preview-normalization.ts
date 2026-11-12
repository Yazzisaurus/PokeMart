import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';

import { AppModule } from '../app.module.js';

import {
  RawSupermarketRow,
} from '../ingestion/entities/raw-supermarket-row.entity.js';

import {
  ProductNormalizerService,
} from './product-normalizer.service.js';

async function main(): Promise<void> {
  const app =
    await NestFactory.createApplicationContext(
      AppModule,
      {
        logger: false,
      },
    );

  const dataSource =
    app.get(DataSource);

  const normalizer =
    app.get(ProductNormalizerService);

  const repository =
    dataSource.getRepository(
      RawSupermarketRow,
    );

  const retailers = [
    'Aldi',
    'ASDA',
    'Morrisons',
    'Sainsburys',
    'Tesco',
  ];

  for (const retailer of retailers) {
    console.log('\n');
    console.log(
      '========================================',
    );
    console.log(retailer);
    console.log(
      '========================================',
    );

    const rows = await repository.find({
      where: {
        retailer,
      },
      order: {
        id: 'ASC',
      },
      take: 3,
    });

    for (const row of rows) {
      const normalizedName =
        normalizer.normalizeName(
          row.productName,
        );

      const quantity =
        normalizer.extractQuantity(
          normalizedName,
        );

      console.log({
        originalName:
          row.productName,

        normalizedName,

        priceMinor:
          normalizer.parsePriceMinor(
            row.priceRaw,
          ),

        unitPriceMinor:
          normalizer.parsePriceMinor(
            row.unitPriceRaw,
          ),

        unit:
          normalizer.normalizeUnit(
            row.unitLabel,
          ),

        category:
          normalizer.normalizeCategory(
            row.category,
          ),

        ownBrand:
          normalizer.parseBoolean(
            row.ownBrandRaw,
          ),

        observedDate:
          normalizer.parseDate(
            row.observedDateRaw,
          ),

        quantity:
          quantity ?? null,
      });

      console.log();
    }
  }

  await app.close();
}

main().catch((error) => {
  console.error(
    'Normalization preview failed:',
    error,
  );

  process.exit(1);
});
