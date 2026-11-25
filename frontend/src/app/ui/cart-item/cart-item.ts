import { Component, input, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { CartLine } from '../../core/cart-state';
import { QuantityStepper } from '../quantity-stepper/quantity-stepper';

@Component({
  selector: 'app-cart-item',
  imports: [MatIcon, QuantityStepper],
  templateUrl: './cart-item.html',
  styleUrl: './cart-item.scss',
})
export class CartItem {
  readonly item = input.required<CartLine>();
  readonly quantityChange = output<number>();
  readonly removed = output<void>();

  protected linePrice(): string {
    return money(this.item().unitPrice * this.item().quantity, this.item().currency);
  }
}

export function money(value: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(value);
}
