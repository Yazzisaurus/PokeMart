import { Injectable, computed, signal } from '@angular/core';
import { StoreId } from '../ui/store-mark/store-mark';

export interface CartLine {
  id: string;
  name: string;
  detail: string;
  store: StoreId;
  storeName: string;
  unitPrice: number;
  quantity: number;
  kind: 'milk' | 'bread' | 'eggs';
}

const initialLines: CartLine[] = [
  {
    id: 'avonmore',
    name: 'Avonmore Fresh Milk',
    detail: '2L (Whole)',
    store: 'aldi',
    storeName: 'ALDI',
    unitPrice: 1.19,
    quantity: 1,
    kind: 'milk',
  },
  {
    id: 'brennans',
    name: 'Brennans Bread',
    detail: '800g (Wholemeal)',
    store: 'lidl',
    storeName: 'Lidl',
    unitPrice: 1.09,
    quantity: 1,
    kind: 'bread',
  },
  {
    id: 'eggs',
    name: 'Happy Eggs',
    detail: '6 Large',
    store: 'tesco',
    storeName: 'Tesco',
    unitPrice: 2.49,
    quantity: 1,
    kind: 'eggs',
  },
];

@Injectable({ providedIn: 'root' })
export class CartState {
  readonly items = signal<CartLine[]>(initialLines);
  readonly count = computed(() => this.items().reduce((sum, item) => sum + item.quantity, 0));

  setQuantity(id: string, quantity: number): void {
    this.items.update((items) =>
      items.map((item) => (item.id === id ? { ...item, quantity } : item)),
    );
  }

  remove(id: string): void {
    this.items.update((items) => items.filter((item) => item.id !== id));
  }

  clear(): void {
    this.items.set([]);
  }
}
