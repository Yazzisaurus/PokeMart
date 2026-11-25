import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';

import { ProductNormalizerService } from '../normalization/product-normalizer.service.js';
import { PriceObservation } from '../prices/entities/price-observation.entity.js';
import { RetailerProduct } from '../products/entities/retailer-product.entity.js';
import { Retailer } from '../retailers/entities/retailer.entity.js';
import { RawSupermarketRow } from './entities/raw-supermarket-row.entity.js';

export interface StagingTransformSummary {
  attempted: number;
  processed: number;
  failed: number;
}

@Injectable()
export class StagingTransformService {
  constructor(
    @InjectRepository(RawSupermarketRow)
    private readonly rawRepository: Repository<RawSupermarketRow>,
    private readonly dataSource: DataSource,
    private readonly normalizer: ProductNormalizerService,
  ) {}

  async transformPending(limit = 10): Promise<StagingTransformSummary> {
    const rows = await this.rawRepository.find({
      where: {
        processedAt: IsNull(),
        processingError: IsNull(),
      },
      order: {
        id: 'ASC',
      },
      take: limit,
    });

    let processed = 0;
    let failed = 0;

    for (const row of rows) {
      try {
        await this.transformRow(row);
        processed++;
      } catch (error) {
        failed++;

        const message =
          error instanceof Error
            ? error.message
            : 'Unknown transformation error';

        await this.rawRepository.update(row.id, {
          processedAt: null,
          processingError: message,
        });
      }
    }

    return {
      attempted: rows.length,
      processed,
      failed,
    };
  }

  private async transformRow(row: RawSupermarketRow): Promise<void> {
    const retailerName = row.retailer.trim();

    if (!retailerName) {
      throw new Error('Retailer name is missing');
    }

    const normalizedName = this.normalizer.normalizeName(row.productName);

    if (!normalizedName) {
      throw new Error('Product name could not be normalized');
    }

    const priceMinor = this.normalizer.parsePriceMinor(row.priceRaw);

    if (priceMinor === undefined || priceMinor <= 0) {
      throw new Error(`Invalid price: ${row.priceRaw ?? 'missing'}`);
    }

    const observedDate = this.normalizer.parseDate(row.observedDateRaw);

    if (!observedDate) {
      throw new Error(
        `Invalid observed date: ${row.observedDateRaw ?? 'missing'}`,
      );
    }

    const parsedUnitPrice = this.normalizer.parsePriceMinor(row.unitPriceRaw);

    const unitPriceMinor =
      parsedUnitPrice !== undefined && parsedUnitPrice > 0
        ? parsedUnitPrice
        : undefined;

    const unitLabel = this.normalizer.normalizeUnit(row.unitLabel);
    const ownBrand = this.normalizer.parseBoolean(row.ownBrandRaw) ?? false;

    await this.dataSource.transaction(async (manager) => {
      const retailerRepository = manager.getRepository(Retailer);
      const productRepository = manager.getRepository(RetailerProduct);
      const priceRepository = manager.getRepository(PriceObservation);
      const rawRepository = manager.getRepository(RawSupermarketRow);

      let retailer = await retailerRepository.findOneBy({
        name: retailerName,
      });

      if (!retailer) {
        retailer = retailerRepository.create({
          name: retailerName,
        });

        retailer = await retailerRepository.save(retailer);
      }

      let product = await productRepository
        .createQueryBuilder('product')
        .leftJoin('product.retailer', 'retailer')
        .where('retailer.id = :retailerId', {
          retailerId: retailer.id,
        })
        .andWhere('product.sourceName = :sourceName', {
          sourceName: row.productName,
        })
        .getOne();

      if (!product) {
        product = productRepository.create({
          retailer,
          sourceName: row.productName,
          normalizedName,
          ownBrand,
          canonicalProduct: null,
          matchMethod: null,
          matchConfidence: null,
        });

        product = await productRepository.save(product);
      }

      const existingPrice = await priceRepository
        .createQueryBuilder('price')
        .leftJoin('price.product', 'product')
        .where('product.id = :productId', {
          productId: product.id,
        })
        .andWhere('price.observedDate = :observedDate', {
          observedDate,
        })
        .getOne();

      if (!existingPrice) {
        const price = priceRepository.create({
          product,
          priceMinor,
          unitPriceMinor,
          unitLabel,
          currency: 'GBP',
          observedDate,
        });

        await priceRepository.save(price);
      }

      await rawRepository.update(row.id, {
        processedAt: new Date(),
        processingError: null,
      });
    });
  }
}
