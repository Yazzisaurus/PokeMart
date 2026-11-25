import { Injectable, inject } from '@angular/core';
import { Api } from './api';
import { get, post } from './urls';

export interface CanonicalProductSummary {
  id: string;
  displayName: string;
}

export interface RetailerSummary {
  id: string;
  name: string;
}

export interface MoneyValue {
  minor: number;
  amount: number;
  currency: string;
}

export interface UnitPriceValue extends MoneyValue {
  unit: string;
}

export interface ProductSearchResult {
  productId: string;
  sourceName: string;
  normalizedName: string;
  ownBrand: boolean;
  canonicalProduct: CanonicalProductSummary | null;
  reviewCandidate: CanonicalProductSummary | null;
  matchMethod: string | null;
  matchConfidence: number | null;
  retailer: RetailerSummary;
  price: MoneyValue;
  unitPrice: UnitPriceValue | null;
  observedDate: string;
}

export interface ProductSearchResponse {
  query: string;
  count: number;
  results: ProductSearchResult[];
}

export interface CanonicalPricesResponse {
  canonicalProductId: string;
  count: number;
  prices: ProductSearchResult[];
}

export interface BasketStoreResult {
  retailer: RetailerSummary;
  complete: boolean;
  matchedProducts: number;
  requestedProducts: number;
  total: MoneyValue;
  missingCanonicalProductIds: string[];
  items: ProductSearchResult[];
}

export interface BasketComparisonResponse {
  requestedCanonicalProductIds: string[];
  requestedCount: number;
  cheapestStore: BasketStoreResult | null;
  stores: BasketStoreResult[];
}

@Injectable({ providedIn: 'root' })
export class ProductsApi {
  private readonly api = inject(Api);

  search(query: string, limit = 20): Promise<ProductSearchResponse> {
    return this.api.request<ProductSearchResponse>(
      get('/products/search', undefined, {
        q: query,
        limit,
      }),
    );
  }

  prices(canonicalProductId: string): Promise<CanonicalPricesResponse> {
    return this.api.request<CanonicalPricesResponse>(
      get('/products/:canonicalId/prices', {
        canonicalId: canonicalProductId,
      }),
    );
  }

  compareBasket(canonicalProductIds: string[]): Promise<BasketComparisonResponse> {
    return this.api.request<BasketComparisonResponse>(
      post('/products/basket/compare', {
        canonicalProductIds,
      }),
    );
  }
}
