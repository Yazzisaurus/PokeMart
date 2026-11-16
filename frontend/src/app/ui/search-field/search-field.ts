import { Component, input, model } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-search-field',
  imports: [MatIcon],
  templateUrl: './search-field.html',
  styleUrl: './search-field.scss',
})
export class SearchField {
  readonly value = model('');
  readonly placeholder = input('Search');
  readonly label = input('Search products');

  protected onInput(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.value.set(target.value);
    }
  }

  protected clear(): void {
    this.value.set('');
  }
}
