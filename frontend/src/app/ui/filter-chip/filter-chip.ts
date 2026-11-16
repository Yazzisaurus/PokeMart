import { Component, input, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-filter-chip',
  imports: [MatIcon],
  templateUrl: './filter-chip.html',
  styleUrl: './filter-chip.scss',
  host: {
    '[class.selected]': 'selected()',
  },
})
export class FilterChip {
  readonly label = input.required<string>();
  readonly icon = input.required<string>();
  readonly selected = input(false);
  readonly trailing = input<'none' | 'expand'>('none');
  readonly pressed = output<void>();
}
