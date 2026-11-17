import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { CartState } from '../core/cart-state';
import { Button } from '../ui/button/button';
import { CartItem } from '../ui/cart-item/cart-item';
import { SavingsCallout } from '../ui/savings-callout/savings-callout';
import { StorePrice } from '../ui/store-price/store-price';
import { StoreRoute } from '../ui/store-route/store-route';

@Component({
  selector: 'app-cart',
  imports: [RouterLink, MatIcon, Button, CartItem, StorePrice, SavingsCallout, StoreRoute],
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
})
export class Cart {
  private readonly cart = inject(CartState);

  protected readonly items = this.cart.items;
  protected readonly count = this.cart.count;

  protected readonly stores = [
    { store: 'aldi' as const, total: '€4.77', delta: null, badge: 'Cheapest here!' },
    { store: 'tesco' as const, total: '€5.36', delta: '+€0.59', badge: null },
    { store: 'lidl' as const, total: '€5.52', delta: '+€0.75', badge: null },
    { store: 'dunnes' as const, total: '€5.89', delta: '+€1.12', badge: null },
  ];

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
}
