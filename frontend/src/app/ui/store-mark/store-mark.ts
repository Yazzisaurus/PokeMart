import { Component, input } from '@angular/core';

export type StoreId = 'aldi' | 'tesco' | 'lidl' | 'dunnes';

@Component({
  selector: 'app-store-mark',
  templateUrl: './store-mark.html',
  styleUrl: './store-mark.scss',
})
export class StoreMark {
  readonly store = input.required<StoreId>();
}
