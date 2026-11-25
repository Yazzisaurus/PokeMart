import { Component, computed, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormField, MatLabel, MatError, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-text-field',
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatError,
    MatSuffix,
    MatInput,
    MatIconButton,
    MatIcon,
  ],
  templateUrl: './text-field.html',
  styleUrl: './text-field.scss',
})
export class TextField {
  readonly label = input.required<string>();
  readonly type = input<'text' | 'email' | 'password'>('text');
  readonly autocomplete = input('');
  readonly error = input<string | null>(null);
  readonly control = input.required<FormControl<string>>();

  protected readonly passwordVisible = signal(false);
  protected readonly inputType = computed(() => {
    if (this.type() === 'password' && this.passwordVisible()) {
      return 'text';
    }
    return this.type();
  });

  protected togglePassword(): void {
    this.passwordVisible.update((visible) => !visible);
  }
}
