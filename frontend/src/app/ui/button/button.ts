import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButton } from '@angular/material/button';

export type ButtonAppearance = 'filled' | 'text';
export type ButtonSize = 'block' | 'compact';

@Component({
  selector: 'app-button',
  imports: [MatButton, RouterLink],
  templateUrl: './button.html',
  styleUrl: './button.scss',
  host: {
    '[class.text]': 'appearance() === "text" || link()',
    '[class.compact]': 'size() === "compact"',
  },
})
export class Button {
  readonly appearance = input<ButtonAppearance>('filled');
  readonly size = input<ButtonSize>('block');
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
  readonly link = input<string | null>(null);
  readonly ariaLabel = input<string | null>(null);
}
