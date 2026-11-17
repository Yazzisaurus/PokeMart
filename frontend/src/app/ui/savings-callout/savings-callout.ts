import { Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-savings-callout',
  imports: [MatIcon],
  templateUrl: './savings-callout.html',
  styleUrl: './savings-callout.scss',
})
export class SavingsCallout {
  readonly title = input.required<string>();
  readonly detail = input.required<string>();
}
