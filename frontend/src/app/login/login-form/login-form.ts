import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../core/auth';
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
  private readonly router = inject(Router);
  private readonly auth = inject(Auth);
  private readonly submitted = signal(false);
  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly signingUp = signal(false);
  protected readonly resetting = signal(false);
  protected readonly resetSent = signal(false);

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

  protected title(): string {
    if (this.resetting()) {
      return 'Forgot password';
    }
    return this.signingUp() ? 'Sign up' : 'Log in';
  }

  protected toggleMode(): void {
    this.signingUp.update((signingUp) => !signingUp);
    this.submitted.set(false);
    this.formError.set(null);
    this.form.markAsUntouched();
    this.form.controls.password.updateValueAndValidity();
    this.form.controls.confirmPassword.updateValueAndValidity();
  }

  protected showReset(): void {
    this.resetting.set(true);
    this.resetSent.set(false);
    this.submitted.set(false);
    this.formError.set(null);
    this.form.markAsUntouched();
  }

  protected showLogin(): void {
    this.resetting.set(false);
    this.resetSent.set(false);
    this.submitted.set(false);
    this.formError.set(null);
    this.form.markAsUntouched();
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

  protected async submit(): Promise<void> {
    this.submitted.set(true);
    this.form.markAllAsTouched();
    this.formError.set(null);
    if (this.resetting()) {
      if (this.form.controls.email.valid) {
        this.resetSent.set(true);
      }
      return;
    }
    if (!this.canEnter() || this.submitting()) {
      return;
    }

    const { email, password } = this.form.getRawValue();
    this.submitting.set(true);
    try {
      if (this.signingUp()) {
        await this.auth.signup(email, password);
      } else {
        await this.auth.login(email, password);
      }
      await this.router.navigateByUrl('/home');
    } catch (error) {
      this.formError.set(this.authError(error));
    } finally {
      this.submitting.set(false);
    }
  }

  private authError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Something went wrong';
    }
    if (error.status === 0) {
      return 'Could not reach the server';
    }
    if (error.status === 401) {
      return 'Email or password is incorrect';
    }
    if (error.status === 409) {
      return 'An account with that email already exists';
    }
    const message = error.error?.message;
    if (typeof message === 'string') {
      return message;
    }
    return 'Something went wrong';
  }

  private canEnter(): boolean {
    if (this.form.controls.email.invalid || this.form.controls.password.invalid) {
      return false;
    }
    return !this.signingUp() || this.form.controls.confirmPassword.valid;
  }
}
