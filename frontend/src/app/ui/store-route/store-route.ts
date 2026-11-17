import { Component, input, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-store-route',
  imports: [MatIcon],
  templateUrl: './store-route.html',
  styleUrl: './store-route.scss',
})
export class StoreRoute {
  readonly name = input.required<string>();
  readonly distance = input.required<string>();
  readonly address = input.required<string>();
  readonly route = output<void>();
}
