import { NestFactory } from '@nestjs/core';
import { DataSource, ILike, Not } from 'typeorm';

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

  console.log(
    `\nSearching real supermarket data for: "${searchTerm}"\n`,
  );

  const rows =
    await repository.find({
      where: {
        productName:
          ILike(`%${searchTerm}%`),
      },
      take: 100,
      order: {
        id: 'ASC',
      },
    });

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
        id: Number(row.id),
        retailer:
          row.retailer,

        originalName:
          row.productName,

        normalizedName,

        category:
          normalizer.normalizeCategory(
            row.category,
          ) ?? null,

        quantityValue:
          quantity?.value ?? null,

        quantityUnit:
          quantity?.unit ?? null,
      };
    });

  const results: {
    left: PreparedProduct;
    right: PreparedProduct;
    score: number;
    method: string;
    nameScore: number;
    categoryScore: number;
    quantityScore: number;
  }[] = [];

  for (
    let i = 0;
    i < prepared.length;
    i++
  ) {
    for (
      let j = i + 1;
      j < prepared.length;
      j++
    ) {

      const left =
        prepared[i];

      const right =
        prepared[j];

      // Cross-retailer comparisons only.
      if (
        left.retailer ===
        right.retailer
      ) {
        continue;
      }

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

  console.log(
    `Found ${results.length} possible cross-retailer matches.\n`,
  );

  for (
    const result
    of results.slice(0, 20)
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
      'Score:',
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
