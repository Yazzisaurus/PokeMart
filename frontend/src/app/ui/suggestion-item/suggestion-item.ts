import { Component, input, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { StoreId, StoreMark } from '../store-mark/store-mark';

@Component({
  selector: 'app-suggestion-item',
  imports: [MatIcon, StoreMark],
  templateUrl: './suggestion-item.html',
  styleUrl: './suggestion-item.scss',
})
export class SuggestionItem {
  readonly name = input.required<string>();
  readonly detail = input.required<string>();
  readonly price = input.required<string>();
  readonly store = input.required<StoreId>();
  readonly storeName = input.required<string>();
  readonly chosen = output<void>();
}
