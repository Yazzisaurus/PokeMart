import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CartState } from '../core/cart-state';
import { ProductSearchResult, ProductsApi } from '../core/products-api';
import { SearchQuery } from '../core/search-query';
import { FilterChip } from '../ui/filter-chip/filter-chip';
import { ProductResult, ProductResultData } from '../ui/product-result/product-result';
import { SearchField } from '../ui/search-field/search-field';

interface SearchFilter {
  id: string;
  label: string;
  icon: string;
  trailing: 'none' | 'expand';
}

@Component({
  selector: 'app-search',
  imports: [SearchField, FilterChip, ProductResult],
  templateUrl: './search.html',
  styleUrl: './search.scss',
})
export class Search implements OnInit {
  private readonly searchQuery = inject(SearchQuery);
  private readonly productsApi = inject(ProductsApi);
  private readonly cart = inject(CartState);

  protected readonly query = this.searchQuery.text;
  protected readonly selected = signal<string[]>(['price']);
  protected readonly products = signal<ProductResultData[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly filters: SearchFilter[] = [
    {
      id: 'price',
      label: 'Best price',
      icon: 'sell',
      trailing: 'none',
    },
  ];

  protected readonly visible = computed(() => {
    const products = this.products();

    if (this.selected().includes('price')) {
      return [...products].sort((a, b) => this.amount(a.price) - this.amount(b.price));
    }

    return products;
  });

  protected readonly resultLabel = computed(() => {
    const count = this.visible().length;
    return count === 1 ? '1 result' : `${count} results`;
  });

  async ngOnInit(): Promise<void> {
    if (this.query().trim()) {
      await this.runSearch(this.query());
    }
  }

  protected isSelected(id: string): boolean {
    return this.selected().includes(id);
  }

  protected isAdded(id: string): boolean {
    return this.cart.items().some((item) => item.id === id);
  }

  protected toggle(id: string): void {
    this.selected.update((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  protected async runSearch(value: string): Promise<void> {
    const query = value.trim();

    if (!query) {
      this.products.set([]);
      return;
    }

    this.query.set(query);
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await this.productsApi.search(query, 20);

      const lowestPrice = Math.min(...response.results.map((result) => result.price.minor));

      this.products.set(
        response.results.map((result) =>
          this.mapProduct(result, result.price.minor === lowestPrice),
        ),
      );
    } catch {
      this.products.set([]);
      this.error.set('Could not load products from the PokéMart API.');
    } finally {
      this.loading.set(false);
    }
  }

  protected add(id: string): void {
    const product = this.products().find((item) => item.id === id);

    if (!product?.canonicalProductId) {
      return;
    }

    this.cart.add({
      id: product.id,
      canonicalProductId: product.canonicalProductId,
      name: product.name,
      detail: product.detail,
      store: product.store,
      storeName: product.storeName,
      unitPrice: product.priceAmount,
      currency: product.currency,
    });
  }

  private mapProduct(result: ProductSearchResult, lowestPrice: boolean): ProductResultData {
    return {
      id: result.productId,
      canonicalProductId: result.canonicalProduct?.id ?? null,
      name: result.canonicalProduct?.displayName ?? result.sourceName,
      detail: result.unitPrice
        ? `${this.money(
            result.unitPrice.amount,
            result.unitPrice.currency,
          )} per ${result.unitPrice.unit}`
        : result.normalizedName,
      store: this.storeId(result.retailer.name),
      storeName: result.retailer.name,
      distance: '',
      price: this.money(result.price.amount, result.price.currency),
      priceAmount: result.price.amount,
      currency: result.price.currency,
      badge: lowestPrice ? 'Lowest price' : undefined,
    };
  }

  private storeId(retailerName: string): ProductResultData['store'] {
    const retailer = retailerName.toLowerCase();

    if (retailer.includes('aldi')) {
      return 'aldi';
    }

    if (retailer.includes('asda')) {
      return 'asda';
    }

    if (retailer.includes('morrisons')) {
      return 'morrisons';
    }

    if (retailer.includes('sainsbury')) {
      return 'sainsburys';
    }

    if (retailer.includes('lidl')) {
      return 'lidl';
    }

    if (retailer.includes('dunnes')) {
      return 'dunnes';
    }

    return 'tesco';
  }

  private money(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  private amount(value: string): number {
    const match = value.match(/[\d.]+/);
    return match ? Number(match[0]) : 0;
  }
}
