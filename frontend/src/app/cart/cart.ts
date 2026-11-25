import { Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { CartState } from '../core/cart-state';
import { BasketStoreResult, ProductsApi } from '../core/products-api';
import { CartItem } from '../ui/cart-item/cart-item';
import { SavingsCallout } from '../ui/savings-callout/savings-callout';
import { StoreId } from '../ui/store-mark/store-mark';
import { StorePrice } from '../ui/store-price/store-price';

interface StoreComparisonView {
  store: StoreId;
  storeName: string;
  total: string;
  totalAmount: number;
  delta: string | null;
  badge: string | null;
}

@Component({
  selector: 'app-cart',
  imports: [RouterLink, MatIcon, CartItem, StorePrice, SavingsCallout],
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
})
export class Cart {
  private readonly cart = inject(CartState);
  private readonly productsApi = inject(ProductsApi);

  protected readonly items = this.cart.items;
  protected readonly count = this.cart.count;

  protected readonly stores = signal<StoreComparisonView[]>([]);
  protected readonly cheapestStore = signal<StoreComparisonView | null>(null);
  protected readonly comparisonLoading = signal(false);
  protected readonly comparisonError = signal<string | null>(null);

  constructor() {
    effect(() => {
      const items = this.items();

      if (items.length === 0) {
        this.stores.set([]);
        this.cheapestStore.set(null);
        this.comparisonError.set(null);
        return;
      }

      void this.refreshComparison();
    });
  }

  protected itemLabel(): string {
    const count = this.count();
    return count === 1 ? '1 item' : `${count} items`;
  }

  protected setQuantity(id: string, quantity: number): void {
    this.cart.setQuantity(id, quantity);
  }

  protected remove(id: string): void {
    this.cart.remove(id);
  }

  protected clear(): void {
    this.cart.clear();
  }

  private async refreshComparison(): Promise<void> {
    const items = this.items();

    const canonicalProductIds = [...new Set(items.map((item) => item.canonicalProductId))];

    this.comparisonLoading.set(true);
    this.comparisonError.set(null);

    try {
      const response = await this.productsApi.compareBasket(canonicalProductIds);

      const completeStores = response.stores
        .filter((store) => store.complete)
        .map((store) => ({
          store,
          totalAmount: this.totalForStore(store),
        }));

      if (completeStores.length === 0) {
        this.stores.set([]);
        this.cheapestStore.set(null);
        this.comparisonError.set('No single retailer can currently satisfy the complete basket.');
        return;
      }

      const cheapestAmount = Math.min(...completeStores.map((store) => store.totalAmount));

      const views = completeStores
        .map(({ store, totalAmount }) => ({
          store: this.storeId(store.retailer.name),
          storeName: store.retailer.name,
          total: this.money(totalAmount, store.total.currency),
          totalAmount,
          delta:
            totalAmount === cheapestAmount
              ? null
              : `+${this.money(totalAmount - cheapestAmount, store.total.currency)}`,
          badge: totalAmount === cheapestAmount ? 'Cheapest here!' : null,
        }))
        .sort((a, b) => a.totalAmount - b.totalAmount);

      this.stores.set(views);
      this.cheapestStore.set(views[0] ?? null);
    } catch {
      this.stores.set([]);
      this.cheapestStore.set(null);
      this.comparisonError.set('Could not compare this basket.');
    } finally {
      this.comparisonLoading.set(false);
    }
  }

  private totalForStore(store: BasketStoreResult): number {
    return store.items.reduce((sum, product) => {
      const canonicalProductId = product.canonicalProduct?.id;

      const cartItem = this.items().find((item) => item.canonicalProductId === canonicalProductId);

      return sum + product.price.amount * (cartItem?.quantity ?? 1);
    }, 0);
  }

  private storeId(name: string): StoreId {
    const retailer = name.toLowerCase();

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
}
