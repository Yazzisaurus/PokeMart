import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { CartState } from '../core/cart-state';
import { SearchQuery } from '../core/search-query';
import { SearchField } from '../ui/search-field/search-field';
import { SuggestionItem } from '../ui/suggestion-item/suggestion-item';
import { StoreId } from '../ui/store-mark/store-mark';

interface Suggestion {
  name: string;
  detail: string;
  price: string;
  store: StoreId;
  storeName: string;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, MatIcon, SearchField, SuggestionItem],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly router = inject(Router);
  private readonly searchQuery = inject(SearchQuery);
  private readonly cart = inject(CartState);

  protected readonly query = this.searchQuery.text;
  protected readonly count = this.cart.count;
  protected readonly suggestions: Suggestion[] = [
    {
      name: 'Avonmore Fresh Milk',
      detail: '2L (Whole)',
      price: '€1.19',
      store: 'aldi',
      storeName: 'Aldi',
    },
    {
      name: 'Tesco Irish Milk',
      detail: '2L (Whole)',
      price: '€1.39',
      store: 'tesco',
      storeName: 'Tesco',
    },
    {
      name: 'Lidl Fresh Milk',
      detail: '2L (Whole)',
      price: '€1.45',
      store: 'lidl',
      storeName: 'Lidl',
    },
    {
      name: 'Dunnes Stores Milk',
      detail: '2L (Whole)',
      price: '€1.49',
      store: 'dunnes',
      storeName: 'Dunnes',
    },
  ];

  protected readonly cheapest = computed(() => {
    const total = this.cart.items().reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    return `€${total.toFixed(2)}`;
  });

  protected itemLabel(): string {
    const count = this.count();
    return count === 1 ? '1 item' : `${count} items`;
  }

  protected openSearch(value = this.query()): void {
    const query = value.trim();
    if (!query) {
      return;
    }
    this.query.set(query);
    void this.router.navigate(['/search']);
  }
}
