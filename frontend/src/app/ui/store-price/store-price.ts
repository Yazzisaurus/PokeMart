import { Component, input } from '@angular/core';
import { StoreId, StoreMark } from '../store-mark/store-mark';

@Component({
  selector: 'app-store-price',
  imports: [StoreMark],
  templateUrl: './store-price.html',
  styleUrl: './store-price.scss',
})
export class StorePrice {
  readonly store = input.required<StoreId>();
  readonly total = input.required<string>();
  readonly delta = input<string | null>(null);
  readonly badge = input<string | null>(null);
}
