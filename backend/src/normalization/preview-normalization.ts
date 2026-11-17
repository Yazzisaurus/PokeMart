import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module.js';

import { RawSupermarketRowRepository } from '../ingestion/raw-supermarket-row.repository.js';

import { ProductNormalizerService } from './product-normalizer.service.js';

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  const rawRows = app.get(RawSupermarketRowRepository);

  const normalizer = app.get(ProductNormalizerService);

  const retailers = ['Aldi', 'ASDA', 'Morrisons', 'Sainsburys', 'Tesco'];

  for (const retailer of retailers) {
    console.log('\n');
    console.log('========================================');
    console.log(retailer);
    console.log('========================================');

    const rows = await rawRows.findByRetailer(retailer, 3);

    for (const row of rows) {
      const normalizedName = normalizer.normalizeName(row.productName);

      const quantity = normalizer.extractQuantity(normalizedName);

      console.log({
        originalName: row.productName,

        normalizedName,

        priceMinor: normalizer.parsePriceMinor(row.priceRaw ?? undefined),

        unitPriceMinor: normalizer.parsePriceMinor(row.unitPriceRaw ?? undefined),

        unit: normalizer.normalizeUnit(row.unitLabel ?? undefined),

        category: normalizer.normalizeCategory(row.category ?? undefined),

        ownBrand: normalizer.parseBoolean(row.ownBrandRaw ?? undefined),

        observedDate: normalizer.parseDate(row.observedDateRaw ?? undefined),

        quantity: quantity ?? null,
      });

      console.log();
    }
  }

  await app.close();
}

main().catch((error) => {
  console.error('Normalization preview failed:', error);

  process.exit(1);
});
