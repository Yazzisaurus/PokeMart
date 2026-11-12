import {
  NestFactory,
} from '@nestjs/core';

import {
  DataSource,
  ILike,
} from 'typeorm';

import {
  AppModule,
} from '../app.module.js';

import {
  RawSupermarketRow,
} from '../ingestion/entities/raw-supermarket-row.entity.js';

import {
  ProductNormalizerService,
} from '../normalization/product-normalizer.service.js';

import {
  ProductMatcherService,
} from './product-matcher.service.js';

interface PreparedProduct {
  id: number;
  retailer: string;
  originalName: string;
  normalizedName: string;
  category: string | null;
  quantityValue: number | null;
  quantityUnit: string | null;
}

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

  const matcher =
    app.get(ProductMatcherService);

  const repository =
    dataSource.getRepository(
      RawSupermarketRow,
    );

  const searchTerm =
    process.argv[2] ?? 'milk';

  const perRetailerLimit =
    Number(
      process.argv[3] ?? '100',
    );

  const retailers = [
    'Aldi',
    'ASDA',
    'Morrisons',
    'Sainsburys',
    'Tesco',
  ];

  console.log(
    `\nSearching real supermarket data for: "${searchTerm}"`,
  );

  console.log(
    `Maximum rows per retailer: ${perRetailerLimit}\n`,
  );

  const rows:
    RawSupermarketRow[] = [];

  for (const retailer of retailers) {
    const retailerRows =
      await repository.find({
        where: {
          retailer,
          productName:
            ILike(
              `%${searchTerm}%`,
            ),
        },

        order: {
          id: 'ASC',
        },

        take:
          perRetailerLimit,
      });

    console.log(
      `${retailer}: ${retailerRows.length} rows`,
    );

    rows.push(
      ...retailerRows,
    );
  }

  const prepared:
    PreparedProduct[] =
    rows.map((row) => {

      const normalizedName =
        normalizer.normalizeName(
          row.productName,
        );

      const quantity =
        normalizer.extractQuantity(
          normalizedName,
        );

      return {
        id:
          Number(row.id),

        retailer:
          row.retailer,

        originalName:
          row.productName,

        normalizedName,

        category:
          normalizer
            .normalizeCategory(
              row.category,
            ) ?? null,

        quantityValue:
          quantity?.value ??
          null,

        quantityUnit:
          quantity?.unit ??
          null,
      };
    });

  /*
   * Remove duplicate product representations.
   *
   * The supermarket source is time-series data,
   * so the same listing may occur more than once.
   */
  const uniqueProducts =
    new Map<
      string,
      PreparedProduct
    >();

  for (const product of prepared) {
    const key = [
      product.retailer,
      product.normalizedName,
      product.category ?? '',
      product.quantityValue ?? '',
      product.quantityUnit ?? '',
    ].join('|');

    if (
      !uniqueProducts.has(key)
    ) {
      uniqueProducts.set(
        key,
        product,
      );
    }
  }

  const products =
    [...uniqueProducts.values()];

  console.log(
    `\nRaw search rows: ${rows.length}`,
  );

  console.log(
    `Unique product listings: ${products.length}\n`,
  );

  const results: {
    left: PreparedProduct;
    right: PreparedProduct;
    score: number;
    method: string;
    nameScore: number;
    jaccardScore: number;
    editScore: number;
    categoryScore: number;
    quantityScore: number;
  }[] = [];

  let comparisons = 0;

  for (
    let i = 0;
    i < products.length;
    i++
  ) {
    for (
      let j = i + 1;
      j < products.length;
      j++
    ) {
      const left =
        products[i];

      const right =
        products[j];

      // PokéMart only needs
      // cross-retailer comparisons here.
      if (
        left.retailer ===
        right.retailer
      ) {
        continue;
      }

      comparisons++;

      const result =
        matcher.compare(
          {
            normalizedName:
              left.normalizedName,

            category:
              left.category,

            quantityValue:
              left.quantityValue,

            quantityUnit:
              left.quantityUnit,
          },
          {
            normalizedName:
              right.normalizedName,

            category:
              right.category,

            quantityValue:
              right.quantityValue,

            quantityUnit:
              right.quantityUnit,
          },
        );

      if (
        result.method !== 'new'
      ) {
        results.push({
          left,
          right,

          score:
            result.score,

          method:
            result.method,

          nameScore:
            result.nameScore,

          jaccardScore:
            result.jaccardScore,

          editScore:
            result.editScore,

          categoryScore:
            result.categoryScore,

          quantityScore:
            result.quantityScore,
        });
      }
    }
  }

  results.sort(
    (a, b) =>
      b.score - a.score,
  );

  const automaticCount =
    results.filter(
      (result) =>
        result.method ===
        'automatic',
    ).length;

  const reviewCount =
    results.filter(
      (result) =>
        result.method ===
        'review',
    ).length;

  console.log(
    `Cross-retailer comparisons: ${comparisons}`,
  );

  console.log(
    `Possible matches: ${results.length}`,
  );

  console.log(
    `Automatic: ${automaticCount}`,
  );

  console.log(
    `Review: ${reviewCount}\n`,
  );

  for (
    const result
    of results.slice(0, 25)
  ) {
    console.log(
      '========================================',
    );

    console.log(
      `${result.left.retailer}:`,
      result.left.originalName,
    );

    console.log(
      `${result.right.retailer}:`,
      result.right.originalName,
    );

    console.log(
      '----------------------------------------',
    );

    console.log(
      'Final score:',
      result.score.toFixed(3),
    );

    console.log(
      'Decision:',
      result.method,
    );

    console.log(
      'Name:',
      result.nameScore.toFixed(3),
    );

    console.log(
      'Jaccard:',
      result.jaccardScore.toFixed(3),
    );

    console.log(
      'Edit:',
      result.editScore.toFixed(3),
    );

    console.log(
      'Category:',
      result.categoryScore.toFixed(3),
    );

    console.log(
      'Quantity:',
      result.quantityScore.toFixed(3),
    );

    console.log();
  }

  await app.close();
}

main().catch((error) => {
  console.error(
    'Matching preview failed:',
    error,
  );

  process.exit(1);
});
