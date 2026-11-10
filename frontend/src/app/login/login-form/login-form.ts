import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { AuthHeader } from '../../ui/auth-header/auth-header';
import { Button } from '../../ui/button/button';
import { TextField } from '../../ui/text-field/text-field';

@Component({
  selector: 'app-login-form',
  imports: [ReactiveFormsModule, AuthHeader, Button, TextField],
  templateUrl: './login-form.html',
  styleUrl: './login-form.scss',
})
export class LoginForm {
  private readonly formBuilder = inject(FormBuilder);
  private readonly submitted = signal(false);
  protected readonly signingUp = signal(false);

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, (control: AbstractControl) => this.validatePassword(control)]],
    confirmPassword: ['', [Validators.required, (control: AbstractControl) => this.validateConfirmPassword(control)]],
  });

  constructor() {
    this.form.controls.password.valueChanges.subscribe(() => {
      this.form.controls.confirmPassword.updateValueAndValidity({ emitEvent: false });
    });
  }

  protected emailError(): string | null {
    const control = this.form.controls.email;
    if (!this.submitted() && !control.touched) {
      return null;
    }
    if (control.hasError('required')) {
      return 'Enter your email';
    }
    if (control.hasError('email')) {
      return 'Enter a valid email';
    }
    return null;
  }

  protected passwordError(): string | null {
    const control = this.form.controls.password;
    if (!this.submitted() && !control.touched) {
      return null;
    }
    if (control.hasError('required')) {
      return 'Enter your password';
    }
    if (this.signingUp() && control.value.length < 8) {
      return 'Use at least 8 characters';
    }
    return null;
  }

  protected confirmPasswordError(): string | null {
    if (!this.signingUp()) {
      return null;
    }
    const control = this.form.controls.confirmPassword;
    if (!this.submitted() && !control.touched) {
      return null;
    }
    if (!control.value) {
      return 'Confirm your password';
    }
    if (control.value !== this.form.controls.password.value) {
      return 'Passwords do not match';
    }
    return null;
  }

  protected toggleMode(): void {
    this.signingUp.update((signingUp) => !signingUp);
    this.submitted.set(false);
    this.form.markAsUntouched();
    this.form.controls.password.updateValueAndValidity();
    this.form.controls.confirmPassword.updateValueAndValidity();
  }

  private validatePassword(control: AbstractControl): ValidationErrors | null {
    if (!this.signingUp() || !control.value || String(control.value).length >= 8) {
      return null;
    }
    return { minlength: true };
  }

  private validateConfirmPassword(control: AbstractControl): ValidationErrors | null {
    if (!this.signingUp() || !control.value || control.value === this.form.controls.password.value) {
      return null;
    }
    return { mismatch: true };
  }

  protected submit(): void {
    this.submitted.set(true);
    this.form.markAllAsTouched();
  }
}
