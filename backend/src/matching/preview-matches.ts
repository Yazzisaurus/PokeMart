import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { RawSupermarketRowRepository } from '../ingestion/raw-supermarket-row.repository.js';
import { ProductNormalizerService } from '../normalization/product-normalizer.service.js';
import { RETAILER_DISPLAY_NAMES } from '../retailers.constants.js';
import {
  MATCH_METHODS,
  PREVIEW_MATCH_DEFAULT_PER_RETAILER_LIMIT,
  PREVIEW_MATCH_DEFAULT_SEARCH_TERM,
  PREVIEW_MATCH_SCORE_FRACTION_DIGITS,
  PREVIEW_MATCH_TOP_RESULTS,
} from './matching.constants.js';
import type { PreparedProduct, PreviewMatchResult } from './matching.types.js';
import { ProductMatcherService } from './product-matcher.service.js';

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });
  const rawRows = app.get(RawSupermarketRowRepository);
  const normalizer = app.get(ProductNormalizerService);
  const matcher = app.get(ProductMatcherService);
  const searchTerm = process.argv[2] ?? PREVIEW_MATCH_DEFAULT_SEARCH_TERM;
  const perRetailerLimit = Number(
    process.argv[3] ?? PREVIEW_MATCH_DEFAULT_PER_RETAILER_LIMIT,
  );
  const rows: Awaited<
    ReturnType<RawSupermarketRowRepository['findByRetailerWhereProductNameContains']>
  > = [];
  for (const retailer of RETAILER_DISPLAY_NAMES) {
    const retailerRows = await rawRows.findByRetailerWhereProductNameContains(
      retailer,
      searchTerm,
      perRetailerLimit,
    );
    rows.push(...retailerRows);
  }
  const prepared: PreparedProduct[] = rows.map((row) => {
    const normalizedName = normalizer.normalizeName(row.productName);
    const quantity = normalizer.extractQuantity(normalizedName);
    return {
      id: Number(row.id),
      retailer: row.retailer,
      originalName: row.productName,
      normalizedName,
      category: normalizer.normalizeCategory(row.category ?? undefined) ?? null,
      quantityValue: quantity?.value ?? null,
      quantityUnit: quantity?.unit ?? null,
    };
  });
  /*
   * Remove duplicate product representations.
   *
   * The supermarket source is time-series data,
   * so the same listing may occur more than once.
   */
  const uniqueProducts = new Map<string, PreparedProduct>();
  for (const product of prepared) {
    const key = [
      product.retailer,
      product.normalizedName,
      product.category ?? '',
      product.quantityValue ?? '',
      product.quantityUnit ?? '',
    ].join('|');
    if (!uniqueProducts.has(key)) {
      uniqueProducts.set(key, product);
    }
  }
  const products = [...uniqueProducts.values()];
  const results: PreviewMatchResult[] = [];
  let comparisons = 0;
  for (let i = 0; i < products.length; i++) {
    for (let j = i + 1; j < products.length; j++) {
      const left = products[i];
      const right = products[j];
      // PokéMart only needs
      // cross-retailer comparisons here.
      if (left.retailer === right.retailer) {
        continue;
      }
      comparisons++;
      const result = matcher.compare(
        {
          normalizedName: left.normalizedName,
          category: left.category,
          quantityValue: left.quantityValue,
          quantityUnit: left.quantityUnit,
        },
        {
          normalizedName: right.normalizedName,
          category: right.category,
          quantityValue: right.quantityValue,
          quantityUnit: right.quantityUnit,
        },
      );
      if (result.method !== MATCH_METHODS.new) {
        results.push({
          left,
          right,
          score: result.score,
          method: result.method,
          nameScore: result.nameScore,
          jaccardScore: result.jaccardScore,
          editScore: result.editScore,
          categoryScore: result.categoryScore,
          quantityScore: result.quantityScore,
        });
      }
    }
  }
  results.sort((a, b) => b.score - a.score);
  const automaticCount = results.filter(
    (result) => result.method === MATCH_METHODS.automatic,
  ).length;
  const reviewCount = results.filter(
    (result) => result.method === MATCH_METHODS.review,
  ).length;
  console.log(
    `"${searchTerm}": ${rows.length} rows, ${products.length} unique, ${comparisons} cross-retailer comparisons, ${results.length} possible (${automaticCount} automatic, ${reviewCount} review)`,
  );
  for (const result of results.slice(0, PREVIEW_MATCH_TOP_RESULTS)) {
    const score = result.score.toFixed(PREVIEW_MATCH_SCORE_FRACTION_DIGITS);
    console.log(
      `${score} ${result.method} | ${result.left.retailer}: ${result.left.originalName} <> ${result.right.retailer}: ${result.right.originalName}`,
    );
  }
  await app.close();
}
main().catch((error) => {
  console.error('Matching preview failed:', error);
  process.exit(1);
});
