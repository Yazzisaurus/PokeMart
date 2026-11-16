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
    return money(this.item().unitPrice * this.item().quantity);
  }
}

export function money(value: number): string {
  return `€${value.toFixed(2)}`;
}
