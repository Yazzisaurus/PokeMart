import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { RawSupermarketRowRepository } from '../ingestion/raw-supermarket-row.repository.js';
import { RETAILER_DISPLAY_NAMES } from '../retailers.constants.js';
import { PREVIEW_NORMALIZATION_SAMPLE_SIZE } from './normalization.constants.js';
import { ProductNormalizerService } from './product-normalizer.service.js';

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });
  const rawRows = app.get(RawSupermarketRowRepository);
  const normalizer = app.get(ProductNormalizerService);
  for (const retailer of RETAILER_DISPLAY_NAMES) {
    const rows = await rawRows.findByRetailer(
      retailer,
      PREVIEW_NORMALIZATION_SAMPLE_SIZE,
    );
    for (const row of rows) {
      const normalizedName = normalizer.normalizeName(row.productName);
      const quantity = normalizer.extractQuantity(normalizedName);
      console.log({
        retailer,
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
    }
  }
  await app.close();
}
main().catch((error) => {
  console.error('Normalization preview failed:', error);
  process.exit(1);
});
