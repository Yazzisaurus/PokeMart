import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButton } from '@angular/material/button';

export type ButtonAppearance = 'filled' | 'text';

@Component({
  selector: 'app-button',
  imports: [MatButton, RouterLink],
  templateUrl: './button.html',
  styleUrl: './button.scss',
  host: {
    '[class.text]': 'appearance() === "text" || link()',
  },
})
export class Button {
  readonly appearance = input<ButtonAppearance>('filled');
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
  readonly link = input<string | null>(null);
}
