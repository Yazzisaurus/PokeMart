import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Button } from '../ui/button/button';
import { TextField } from '../ui/text-field/text-field';

const REM_MIN_PX = 12;
const REM_MAX_PX = 20;
const REM_DEFAULT_PX = 16;

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
  protected readonly remMin = REM_MIN_PX;
  protected readonly remMax = REM_MAX_PX;
  protected readonly remPx = signal(REM_DEFAULT_PX);

  protected readonly form = this.formBuilder.nonNullable.group({
    name: [{ value: 'Syed Muhammad Akbar', disabled: true }],
    email: [{ value: 'sm.akbar42@gmail.com', disabled: true }],
    currentPassword: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required, (control: AbstractControl) => this.passwordsMatch(control)]],
  });

  constructor() {
    const stored = this.readRemPx();
    this.remPx.set(stored);
    document.documentElement.style.fontSize = `${stored}px`;
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
    const next = this.clampRemPx(value);
    this.remPx.set(next);
    document.documentElement.style.fontSize = `${next}px`;
    localStorage.setItem(this.form.controls.email.value, JSON.stringify({ remPx: next }));
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

  private readRemPx(): number {
    const raw = localStorage.getItem(this.form.controls.email.value);
    if (!raw) {
      return REM_DEFAULT_PX;
    }
    try {
      const parsed = Number(JSON.parse(raw).remPx);
      if (!Number.isFinite(parsed)) {
        return REM_DEFAULT_PX;
      }
      return this.clampRemPx(parsed);
    } catch {
      return REM_DEFAULT_PX;
    }
  }

  private clampRemPx(value: number): number {
    return Math.min(REM_MAX_PX, Math.max(REM_MIN_PX, Math.round(value)));
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
