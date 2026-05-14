import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

function passwordMatch(control: AbstractControl): ValidationErrors | null {
  const pass    = control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return pass && confirm && pass !== confirm ? { mismatch: true } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: '../auth-shared.css',
})
export class RegisterComponent {
  private readonly fb     = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth   = inject(AuthService);

  readonly loading  = signal(false);
  readonly message  = signal('');
  readonly success  = signal(false);
  readonly showPass = signal(false);

  readonly form = this.fb.nonNullable.group({
    fullName:        ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    email:           ['', [Validators.required, Validators.email]],
    phoneNumber:     ['', [Validators.pattern(/^[0-9+\-\s]{7,15}$/)]],
    password:        ['', [Validators.required, Validators.minLength(8),
                           Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/)]],
    confirmPassword: ['', [Validators.required]],
  }, { validators: passwordMatch });

  get f() { return this.form.controls; }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading.set(true);
    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.success.set(true);
        this.message.set('Account created! Check your email for the verification code.');
        setTimeout(() =>
          this.router.navigate(['/auth/confirm-email'],
            { queryParams: { email: this.f.email.value } }), 1500);
      },
      error: (err) => {
        this.success.set(false);
        this.message.set(err?.error?.data || 'Registration failed. Try again.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }
}
