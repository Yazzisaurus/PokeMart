import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

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
    return null;
  }

  protected submit(): void {
    this.submitted.set(true);
    this.form.markAllAsTouched();
  }
}
