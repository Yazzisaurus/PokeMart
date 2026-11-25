import { Component, inject, input, output, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Button } from '../button/button';
import { StoreId } from '../store-mark/store-mark';
import { Api } from '../../core/api';

export interface ProductResultData {
  id: string;
  canonicalProductId: string | null;
  name: string;
  detail: string;
  store: StoreId;
  storeName: string;
  distance: string;
  price: string;
  priceAmount: number;
  currency: string;
  badge?: string;
}

@Component({
  selector: 'app-product-result',
  imports: [MatIcon, Button],
  templateUrl: './product-result.html',
  styleUrl: './product-result.scss',
})
export class ProductResult {
  readonly product = input.required<ProductResultData>();
  readonly inCart = input(false);
  readonly added = output<string>();
  private readonly api = inject(Api);

  protected readonly historyOpen = signal(false);
  protected readonly historyLoading = signal(false);
  protected readonly historyLoaded = signal(false);
  protected readonly historyError = signal(false);
  protected readonly history = signal<PriceHistoryEntry[]>([]);

  protected async toggleHistory(): Promise<void> {
    if (this.historyOpen()) {
      this.historyOpen.set(false);
      return;
    }

    this.historyOpen.set(true);

    if (this.historyLoaded()) {
      return;
    }

    this.historyLoading.set(true);
    this.historyError.set(false);

    try {
      const response = await this.api.request<PriceHistoryResponse>({
        method: 'GET',
        path: `/products/retailer/${this.product().id}/history`,
      });

      this.history.set(response.history);
      this.historyLoaded.set(true);
    } catch {
      this.historyError.set(true);
    } finally {
      this.historyLoading.set(false);
    }
  }

  protected historyPrice(entry: PriceHistoryEntry): string {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: entry.price.currency,
    }).format(entry.price.amount);
  }

  protected historyDate(value: string): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  }
}

interface PriceHistoryEntry {
  sourceName: string;
  retailer: {
    id: string;
    name: string;
  };
  price: {
    minor: number;
    amount: number;
    currency: string;
  };
  observedDate: string;
}

interface PriceHistoryResponse {
  productId: string;
  count: number;
  history: PriceHistoryEntry[];
}
