import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-email-confirmation',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './email-confirmation.component.html',
  styleUrl: '../auth-shared.css',
})
export class EmailConfirmationComponent {
  private readonly fb    = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly auth  = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly message = signal('');
  readonly success = signal(false);

  readonly form = this.fb.nonNullable.group({
    email:            [this.route.snapshot.queryParamMap.get('email') || '',
                       [Validators.required, Validators.email]],
    verificationCode: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });

  get f() { return this.form.controls; }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.auth.confirmEmail(this.form.getRawValue()).subscribe({
      next: () => {
        this.success.set(true);
        this.message.set('Email confirmed! Redirecting to login...');
        setTimeout(() => this.router.navigate(['/auth/login']), 1500);
      },
      error: (err) => {
        this.success.set(false);
        this.message.set(err?.error?.data || 'Invalid verification code.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  resend(): void {
    const email = this.f.email.value;
    if (!email) return;
    this.auth.resendConfirmation(email).subscribe({
      next: () => {
        this.success.set(true);
        this.message.set('Verification code resent. Check your inbox.');
      },
      error: () => {
        this.success.set(false);
        this.message.set('Could not resend code. Try again.');
      },
    });
  }
}
