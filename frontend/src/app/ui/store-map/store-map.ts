import { Component, input } from '@angular/core';

export interface StoreMapPin {
  name: string;
  distance: string;
  x: number;
  y: number;
  callout?: {
    title: string;
    price: string;
  };
}

@Component({
  selector: 'app-store-map',
  templateUrl: './store-map.html',
  styleUrl: './store-map.scss',
})
export class StoreMap {
  readonly city = input('Cork');
  readonly pins = input.required<StoreMapPin[]>();
}
