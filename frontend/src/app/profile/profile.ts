import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { accessibilityLimits, readAccessibility, saveAccessibility } from '../core/accessibility';
import { Button } from '../ui/button/button';
import { TextField } from '../ui/text-field/text-field';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, Button, TextField],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  private readonly formBuilder = inject(FormBuilder);
  private readonly submitted = signal(false);
  protected readonly changing = signal(false);
  protected readonly updated = signal(false);
  protected readonly remMin = accessibilityLimits.remMin;
  protected readonly remMax = accessibilityLimits.remMax;
  protected readonly remPx = signal(accessibilityLimits.remDefault);
  protected readonly highContrast = signal(false);

  protected readonly form = this.formBuilder.nonNullable.group({
    name: [{ value: 'Syed Muhammad Akbar', disabled: true }],
    email: [{ value: 'sm.akbar42@gmail.com', disabled: true }],
    currentPassword: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required, (control: AbstractControl) => this.passwordsMatch(control)]],
  });

  constructor() {
    const stored = readAccessibility();
    this.remPx.set(stored.remPx);
    this.highContrast.set(stored.highContrast);
    this.form.controls.password.valueChanges.subscribe(() => {
      this.form.controls.confirmPassword.updateValueAndValidity({ emitEvent: false });
    });
  }

  protected currentPasswordError(): string | null {
    return this.requiredError(this.form.controls.currentPassword, 'Enter your current password');
  }

  protected passwordError(): string | null {
    const control = this.form.controls.password;
    if (!this.showError(control)) {
      return null;
    }
    if (control.hasError('required')) {
      return 'Enter a new password';
    }
    if (control.hasError('minlength')) {
      return 'Use at least 8 characters';
    }
    return null;
  }

  protected confirmPasswordError(): string | null {
    const control = this.form.controls.confirmPassword;
    if (!this.showError(control)) {
      return null;
    }
    if (control.hasError('required')) {
      return 'Confirm your new password';
    }
    if (control.hasError('mismatch')) {
      return 'Passwords do not match';
    }
    return null;
  }

  protected setRemPx(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    saveAccessibility({ remPx: value, highContrast: this.highContrast() });
    this.remPx.set(readAccessibility().remPx);
  }

  protected setHighContrast(event: Event): void {
    const next = (event.target as HTMLInputElement).checked;
    this.highContrast.set(next);
    saveAccessibility({ remPx: this.remPx(), highContrast: next });
  }

  protected startChange(): void {
    this.updated.set(false);
    this.submitted.set(false);
    this.changing.set(true);
  }

  protected cancel(): void {
    this.changing.set(false);
    this.submitted.set(false);
    this.form.controls.currentPassword.reset();
    this.form.controls.password.reset();
    this.form.controls.confirmPassword.reset();
  }

  protected save(): void {
    this.submitted.set(true);
    this.form.controls.currentPassword.markAsTouched();
    this.form.controls.password.markAsTouched();
    this.form.controls.confirmPassword.markAsTouched();
    if (
      this.form.controls.currentPassword.invalid ||
      this.form.controls.password.invalid ||
      this.form.controls.confirmPassword.invalid
    ) {
      return;
    }
    this.cancel();
    this.updated.set(true);
  }

  private showError(control: AbstractControl): boolean {
    return this.submitted() || control.touched;
  }

  private requiredError(control: AbstractControl, message: string): string | null {
    if (!this.showError(control) || !control.hasError('required')) {
      return null;
    }
    return message;
  }

  private passwordsMatch(control: AbstractControl): ValidationErrors | null {
    if (!control.value || control.value === this.form?.controls.password.value) {
      return null;
    }
    return { mismatch: true };
  }
}
