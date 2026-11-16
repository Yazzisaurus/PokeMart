import { Component, input, model } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-quantity-stepper',
  imports: [MatIcon],
  templateUrl: './quantity-stepper.html',
  styleUrl: './quantity-stepper.scss',
})
export class QuantityStepper {
  readonly value = model(1);
  readonly min = input(1);

  protected decrease(): void {
    if (this.value() > this.min()) {
      this.value.update((current) => current - 1);
    }
  }

  protected increase(): void {
    this.value.update((current) => current + 1);
  }
}
