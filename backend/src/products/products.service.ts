import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RetailerProduct } from './entities/retailer-product.entity.js';

interface RawProductSearchRow {
  productId: string;
  sourceName: string;
  normalizedName: string;
  ownBrand: boolean;
  matchMethod: string | null;
  matchConfidence: number | null;
  canonicalId: string | null;
  canonicalDisplayName: string | null;
  retailerId: string;
  retailerName: string;
  priceMinor: number;
  unitPriceMinor: number | null;
  unitLabel: string | null;
  currency: string;
  observedDate: string;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(RetailerProduct)
    private readonly retailerProductRepository: Repository<RetailerProduct>,
  ) {}

  async search(query: string, limit = 25) {
    const pattern = `%${query.trim()}%`;

    const rows = await this.basePriceQuery()
      .where(
        `
        (
          product.source_name ILIKE :pattern
          OR product.normalized_name ILIKE :pattern
          OR canonical.display_name ILIKE :pattern
          OR canonical.normalized_name ILIKE :pattern
        )
        `,
        { pattern },
      )
      .orderBy('product.normalized_name', 'ASC')
      .addOrderBy('retailer.name', 'ASC')
      .limit(limit)
      .getRawMany<RawProductSearchRow>();

    return {
      query,
      count: rows.length,
      results: rows.map((row) => this.mapResult(row)),
    };
  }

  async pricesForCanonical(canonicalId: string) {
    const rows = await this.basePriceQuery()
      .where('canonical.id = :canonicalId', { canonicalId })
      .andWhere(`product.match_method IN ('automatic', 'new')`)
      .orderBy('price.price_minor', 'ASC')
      .addOrderBy('retailer.name', 'ASC')
      .getRawMany<RawProductSearchRow>();

    return {
      canonicalProductId: canonicalId,
      count: rows.length,
      prices: rows.map((row) => this.mapResult(row)),
    };
  }

  async historyForProduct(productId: string) {
    const rows = await this.retailerProductRepository
      .createQueryBuilder('product')
      .innerJoin('product.retailer', 'retailer')
      .innerJoin('product.prices', 'price')
      .where('product.id = :productId', { productId })
      .select([
        'product.id AS "productId"',
        'product.source_name AS "sourceName"',
        'retailer.id AS "retailerId"',
        'retailer.name AS "retailerName"',
        'price.price_minor AS "priceMinor"',
        'price.unit_price_minor AS "unitPriceMinor"',
        'price.unit_label AS "unitLabel"',
        'price.currency AS "currency"',
        'price.observed_date AS "observedDate"',
      ])
      .orderBy('price.observed_date', 'ASC')
      .getRawMany<{
        productId: string;
        sourceName: string;
        retailerId: string;
        retailerName: string;
        priceMinor: number;
        unitPriceMinor: number | null;
        unitLabel: string | null;
        currency: string;
        observedDate: string;
      }>();

    return {
      productId,
      count: rows.length,
      history: rows.map((row) => ({
        sourceName: row.sourceName,
        retailer: {
          id: row.retailerId,
          name: row.retailerName,
        },
        price: {
          minor: Number(row.priceMinor),
          amount: Number(row.priceMinor) / 100,
          currency: row.currency,
        },
        unitPrice:
          row.unitPriceMinor == null
            ? null
            : {
                minor: Number(row.unitPriceMinor),
                amount: Number(row.unitPriceMinor) / 100,
                unit: row.unitLabel,
                currency: row.currency,
              },
        observedDate: row.observedDate,
      })),
    };
  }

  async compareBasket(canonicalProductIds: string[]) {
    const requestedIds = [...new Set(canonicalProductIds)];

    const rows = await this.basePriceQuery()
      .where('canonical.id IN (:...canonicalIds)', {
        canonicalIds: requestedIds,
      })
      .andWhere(`product.match_method IN ('automatic', 'new')`)
      .getRawMany<RawProductSearchRow>();

    const retailers = new Map<
      string,
      {
        retailerId: string;
        retailerName: string;
        products: Map<string, RawProductSearchRow>;
      }
    >();

    for (const row of rows) {
      if (!row.canonicalId) {
        continue;
      }

      let retailer = retailers.get(row.retailerId);

      if (!retailer) {
        retailer = {
          retailerId: row.retailerId,
          retailerName: row.retailerName,
          products: new Map<string, RawProductSearchRow>(),
        };

        retailers.set(row.retailerId, retailer);
      }

      const existing = retailer.products.get(row.canonicalId);

      if (!existing || row.priceMinor < existing.priceMinor) {
        retailer.products.set(row.canonicalId, row);
      }
    }

    const stores = [...retailers.values()]
      .map((retailer) => {
        const selectedRows = [...retailer.products.values()];

        const totalMinor = selectedRows.reduce(
          (total, row) => total + row.priceMinor,
          0,
        );

        const missingCanonicalProductIds = requestedIds.filter(
          (id) => !retailer.products.has(id),
        );

        return {
          retailer: {
            id: retailer.retailerId,
            name: retailer.retailerName,
          },

          complete: missingCanonicalProductIds.length === 0,

          matchedProducts: selectedRows.length,

          requestedProducts: requestedIds.length,

          total: {
            minor: totalMinor,
            amount: totalMinor / 100,
            currency: 'GBP',
          },

          missingCanonicalProductIds,

          items: selectedRows.map((row) => this.mapResult(row)),
        };
      })
      .sort((left, right) => {
        if (left.complete !== right.complete) {
          return left.complete ? -1 : 1;
        }

        return left.total.minor - right.total.minor;
      });

    const cheapestStore = stores.find((store) => store.complete) ?? null;

    return {
      requestedCanonicalProductIds: requestedIds,
      requestedCount: requestedIds.length,
      cheapestStore,
      stores,
    };
  }

  private basePriceQuery() {
    return this.retailerProductRepository
      .createQueryBuilder('product')
      .innerJoin('product.retailer', 'retailer')
      .leftJoin('product.canonicalProduct', 'canonical')
      .innerJoin('product.prices', 'price')
      .select([
        'product.id AS "productId"',
        'product.source_name AS "sourceName"',
        'product.normalized_name AS "normalizedName"',
        'product.own_brand AS "ownBrand"',
        'product.match_method AS "matchMethod"',
        'product.match_confidence AS "matchConfidence"',
        'canonical.id AS "canonicalId"',
        'canonical.display_name AS "canonicalDisplayName"',
        'retailer.id AS "retailerId"',
        'retailer.name AS "retailerName"',
        'price.price_minor AS "priceMinor"',
        'price.unit_price_minor AS "unitPriceMinor"',
        'price.unit_label AS "unitLabel"',
        'price.currency AS "currency"',
        'price.observed_date AS "observedDate"',
      ])
      .andWhere(
        `
        price.observed_date = (
          SELECT MAX(latest_price.observed_date)
          FROM price_observations latest_price
          WHERE latest_price.retailer_product_id = product.id
        )
        `,
      );
  }

  private mapResult(row: RawProductSearchRow) {
    const confirmedCanonical =
      row.matchMethod !== 'review' && row.canonicalId
        ? {
            id: row.canonicalId,
            displayName: row.canonicalDisplayName,
          }
        : null;

    const reviewCandidate =
      row.matchMethod === 'review' && row.canonicalId
        ? {
            id: row.canonicalId,
            displayName: row.canonicalDisplayName,
          }
        : null;

    return {
      productId: row.productId,
      sourceName: row.sourceName,
      normalizedName: row.normalizedName,
      ownBrand: row.ownBrand,

      canonicalProduct: confirmedCanonical,
      reviewCandidate,

      matchMethod: row.matchMethod,
      matchConfidence: row.matchConfidence,

      retailer: {
        id: row.retailerId,
        name: row.retailerName,
      },

      price: {
        minor: row.priceMinor,
        amount: row.priceMinor / 100,
        currency: row.currency,
      },

      unitPrice:
        row.unitPriceMinor == null
          ? null
          : {
              minor: row.unitPriceMinor,
              amount: row.unitPriceMinor / 100,
              unit: row.unitLabel,
              currency: row.currency,
            },

      observedDate: row.observedDate,
    };
  }
}
