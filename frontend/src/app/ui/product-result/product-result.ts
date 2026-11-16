import { Component, input, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Button } from '../button/button';

export interface ProductResultData {
  id: string;
  name: string;
  detail: string;
  store: 'aldi' | 'tesco' | 'lidl' | 'dunnes';
  storeName: string;
  distance: string;
  price: string;
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
}
