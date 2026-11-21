import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProductNormalizerService } from '../normalization/product-normalizer.service.js';
import { CanonicalProduct } from '../products/entities/canonical-product.entity.js';
import { RetailerProduct } from '../products/entities/retailer-product.entity.js';
import {
  ProductMatcherService,
  type MatchableProduct,
  type ProductMatchResult,
} from './product-matcher.service.js';

export interface CanonicalAssignmentSummary {
  attempted: number;
  automatic: number;
  review: number;
  created: number;
  failed: number;
}

@Injectable()
export class CanonicalAssignmentService {
  constructor(
    @InjectRepository(RetailerProduct)
    private readonly retailerProductRepository: Repository<RetailerProduct>,

    @InjectRepository(CanonicalProduct)
    private readonly canonicalProductRepository: Repository<CanonicalProduct>,

    private readonly matcher: ProductMatcherService,

    private readonly normalizer: ProductNormalizerService,
  ) {}

  async assignPending(limit = 10): Promise<CanonicalAssignmentSummary> {
    const products = await this.retailerProductRepository
      .createQueryBuilder('product')
      .where('product.canonical_product_id IS NULL')
      .andWhere('product.match_method IS NULL')
      .orderBy('product.source_name', 'ASC')
      .take(limit)
      .getMany();

    const canonicals = await this.canonicalProductRepository.find();

    const index = this.buildTokenIndex(canonicals);

    const summary: CanonicalAssignmentSummary = {
      attempted: products.length,
      automatic: 0,
      review: 0,
      created: 0,
      failed: 0,
    };

    for (const product of products) {
      try {
        const quantity = this.normalizer.extractQuantity(
          product.normalizedName,
        );

        const matchableProduct: MatchableProduct = {
          normalizedName: product.normalizedName,
          category: null,
          quantityValue: quantity?.value ?? null,
          quantityUnit: quantity?.unit ?? null,
        };

        const candidates = this.findCandidates(product.normalizedName, index);

        const best = this.findBestMatch(matchableProduct, candidates);

        if (best && best.result.method === 'automatic') {
          product.canonicalProduct = best.canonical;
          product.matchMethod = 'automatic';
          product.matchConfidence = best.result.score;

          await this.retailerProductRepository.save(product);

          summary.automatic += 1;
          continue;
        }

        if (best && best.result.method === 'review') {
          product.canonicalProduct = best.canonical;
          product.matchMethod = 'review';
          product.matchConfidence = best.result.score;

          await this.retailerProductRepository.save(product);

          summary.review += 1;
          continue;
        }

        const canonical = await this.createCanonicalProduct(product);

        product.canonicalProduct = canonical;
        product.matchMethod = 'new';
        product.matchConfidence = null;

        await this.retailerProductRepository.save(product);

        this.addToTokenIndex(index, canonical);

        summary.created += 1;
      } catch (error) {
        summary.failed += 1;

        const message = error instanceof Error ? error.message : String(error);

        console.error(
          `Canonical assignment failed for ${product.id}: ${message}`,
        );
      }
    }

    return summary;
  }

  private async createCanonicalProduct(
    product: RetailerProduct,
  ): Promise<CanonicalProduct> {
    const quantity = this.normalizer.extractQuantity(product.normalizedName);

    const canonical = this.canonicalProductRepository.create({
      displayName: product.sourceName,
      normalizedName: product.normalizedName,
      category: null,
      quantityValue: quantity?.value ?? null,
      quantityUnit: quantity?.unit ?? null,
    });

    return this.canonicalProductRepository.save(canonical);
  }

  private findBestMatch(
    product: MatchableProduct,
    candidates: CanonicalProduct[],
  ):
    | {
        canonical: CanonicalProduct;
        result: ProductMatchResult;
      }
    | undefined {
    let best:
      | {
          canonical: CanonicalProduct;
          result: ProductMatchResult;
        }
      | undefined;

    for (const canonical of candidates) {
      const result = this.matcher.compare(product, {
        normalizedName: canonical.normalizedName,
        category: canonical.category,
        quantityValue: canonical.quantityValue,
        quantityUnit: canonical.quantityUnit,
      });

      if (!best || result.score > best.result.score) {
        best = {
          canonical,
          result,
        };
      }
    }

    return best;
  }

  private buildTokenIndex(
    canonicals: CanonicalProduct[],
  ): Map<string, CanonicalProduct[]> {
    const index = new Map<string, CanonicalProduct[]>();

    for (const canonical of canonicals) {
      this.addToTokenIndex(index, canonical);
    }

    return index;
  }

  private addToTokenIndex(
    index: Map<string, CanonicalProduct[]>,
    canonical: CanonicalProduct,
  ): void {
    for (const token of this.matcher.tokenize(canonical.normalizedName)) {
      if (token.length < 2) {
        continue;
      }

      const values = index.get(token) ?? [];

      values.push(canonical);

      index.set(token, values);
    }
  }

  private findCandidates(
    normalizedName: string,
    index: Map<string, CanonicalProduct[]>,
  ): CanonicalProduct[] {
    const candidates = new Map<string, CanonicalProduct>();

    for (const token of this.matcher.tokenize(normalizedName)) {
      if (token.length < 2) {
        continue;
      }

      for (const canonical of index.get(token) ?? []) {
        candidates.set(canonical.id, canonical);
      }
    }

    return [...candidates.values()];
  }
}
