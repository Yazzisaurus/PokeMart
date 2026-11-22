import { Injectable, computed, signal } from '@angular/core';
import { StoreId } from '../ui/store-mark/store-mark';

export type CartItemKind = 'milk' | 'bread' | 'eggs' | 'generic';

export interface CartLine {
  id: string;
  canonicalProductId: string;
  name: string;
  detail: string;
  store: StoreId;
  storeName: string;
  unitPrice: number;
  currency: string;
  quantity: number;
  kind: CartItemKind;
}

export interface NewCartLine {
  id: string;
  canonicalProductId: string;
  name: string;
  detail: string;
  store: StoreId;
  storeName: string;
  unitPrice: number;
  currency: string;
  kind?: CartItemKind;
}

@Injectable({ providedIn: 'root' })
export class CartState {
  readonly items = signal<CartLine[]>([]);

  readonly count = computed(() => this.items().reduce((sum, item) => sum + item.quantity, 0));

  add(line: NewCartLine): void {
    this.items.update((items) => {
      const existing = items.find((item) => item.canonicalProductId === line.canonicalProductId);

      if (existing) {
        return items.map((item) =>
          item.canonicalProductId === line.canonicalProductId
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        );
      }

      return [
        ...items,
        {
          ...line,
          quantity: 1,
          kind: line.kind ?? 'generic',
        },
      ];
    });
  }

  setQuantity(id: string, quantity: number): void {
    this.items.update((items) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity,
            }
          : item,
      ),
    );
  }

  remove(id: string): void {
    this.items.update((items) => items.filter((item) => item.id !== id));
  }

  clear(): void {
    this.items.set([]);
  }
}
