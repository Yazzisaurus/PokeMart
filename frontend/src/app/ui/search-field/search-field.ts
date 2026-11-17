import { Component, input, model, output } from '@angular/core';
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
  readonly submitted = output<string>();

  protected onInput(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.value.set(target.value);
    }
  }

  protected submit(event: Event): void {
    event.preventDefault();
    const value = this.value().trim();
    if (value) {
      this.submitted.emit(value);
    }
  }

  protected clear(): void {
    this.value.set('');
  }
}
