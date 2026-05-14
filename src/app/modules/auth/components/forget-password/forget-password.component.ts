import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forget-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forget-password.component.html',
  styleUrl: '../auth-shared.css',
})
export class ForgetPasswordComponent {
  private readonly fb    = inject(FormBuilder);
  private readonly auth  = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly message = signal('');
  readonly sent    = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  get f() { return this.form.controls; }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.auth.forgotPassword(this.f.email.value).subscribe({
      next: () => {
        this.sent.set(true);
        this.message.set('If this email is registered, a reset code has been sent.');
        setTimeout(() =>
          this.router.navigate(['/auth/reset-password'],
            { queryParams: { email: this.f.email.value } }), 1500);
      },
      error: () => {
        this.sent.set(false);
        this.message.set('Something went wrong. Please try again.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }
}
