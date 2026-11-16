import { Component, computed, inject, signal } from '@angular/core';
import { SearchQuery } from '../core/search-query';
import { FilterChip } from '../ui/filter-chip/filter-chip';
import { ProductResult, ProductResultData } from '../ui/product-result/product-result';
import { SearchField } from '../ui/search-field/search-field';
import { StoreMap, StoreMapPin } from '../ui/store-map/store-map';

interface SearchFilter {
  id: string;
  label: string;
  icon: string;
  trailing: 'none' | 'expand';
}

@Component({
  selector: 'app-search',
  imports: [SearchField, FilterChip, StoreMap, ProductResult],
  templateUrl: './search.html',
  styleUrl: './search.scss',
})
export class Search {
  private readonly searchQuery = inject(SearchQuery);
  protected readonly query = this.searchQuery.text;
  protected readonly selected = signal<string[]>(['nearby']);
  protected readonly added = signal<string[]>([]);

  protected readonly filters: SearchFilter[] = [
    { id: 'nearby', label: 'Nearby', icon: 'location_on', trailing: 'none' },
    { id: 'price', label: 'Best price', icon: 'sell', trailing: 'none' },
    { id: 'stock', label: 'In stock', icon: 'inventory_2', trailing: 'none' },
    { id: 'more', label: 'More', icon: 'filter_alt', trailing: 'expand' },
  ];

  protected readonly pins: StoreMapPin[] = [
    {
      name: 'Aldi',
      distance: '1.2 km',
      x: 20,
      y: 30,
      callout: { title: 'Cheapest here!', price: '€1.19' },
    },
    { name: 'Dunnes', distance: '3.1 km', x: 30, y: 74 },
    { name: 'Tesco', distance: '2.4 km', x: 72, y: 16 },
    { name: 'Lidl', distance: '2.8 km', x: 78, y: 58 },
  ];

  protected readonly products: ProductResultData[] = [
    {
      id: 'avonmore-aldi',
      name: 'Avonmore Fresh Milk',
      detail: '2L (Whole)',
      store: 'aldi',
      storeName: 'ALDI',
      distance: '1.2 km',
      price: '€1.19',
      badge: 'Lowest price',
    },
    {
      id: 'tesco-irish',
      name: 'Tesco Irish Milk',
      detail: '2L (Whole)',
      store: 'tesco',
      storeName: 'TESCO',
      distance: '2.4 km',
      price: '€1.39',
    },
    {
      id: 'lidl-fresh',
      name: 'Lidl Fresh Milk',
      detail: '2L (Whole)',
      store: 'lidl',
      storeName: 'LIDL',
      distance: '2.8 km',
      price: '€1.45',
    },
    {
      id: 'dunnes-milk',
      name: 'Dunnes Stores Milk',
      detail: '2L (Whole)',
      store: 'dunnes',
      storeName: 'DUNNES',
      distance: '3.1 km',
      price: '€1.49',
    },
  ];

  protected readonly visible = computed(() => {
    const query = this.query().trim().toLowerCase();
    const products = query
      ? this.products.filter((product) =>
          `${product.name} ${product.detail} ${product.storeName}`.toLowerCase().includes(query),
        )
      : this.products;
    const selected = this.selected();
    if (selected.includes('price') && !selected.includes('nearby')) {
      return [...products].sort((a, b) => this.amount(a.price) - this.amount(b.price));
    }
    if (selected.includes('nearby') && !selected.includes('price')) {
      return [...products].sort((a, b) => this.amount(a.distance) - this.amount(b.distance));
    }
    return products;
  });

  protected readonly resultLabel = computed(() => {
    const count = this.visible().length;
    return count === 1 ? '1 result' : `${count} results`;
  });

  protected isSelected(id: string): boolean {
    return this.selected().includes(id);
  }

  protected isAdded(id: string): boolean {
    return this.added().includes(id);
  }

  protected toggle(id: string): void {
    this.selected.update((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  protected add(id: string): void {
    this.added.update((current) => (current.includes(id) ? current : [...current, id]));
  }

  private amount(value: string): number {
    const match = value.match(/[\d.]+/);
    return match ? Number(match[0]) : 0;
  }
}
