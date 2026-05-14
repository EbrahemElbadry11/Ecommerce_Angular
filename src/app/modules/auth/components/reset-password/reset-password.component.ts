import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

function passwordMatch(control: AbstractControl): ValidationErrors | null {
  const p = control.get('newPassword')?.value;
  const c = control.get('confirmNewPassword')?.value;
  return p && c && p !== c ? { mismatch: true } : null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: '../auth-shared.css',
})
export class ResetPasswordComponent {
  private readonly fb    = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly auth  = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading  = signal(false);
  readonly message  = signal('');
  readonly success  = signal(false);
  readonly showPass = signal(false);
  readonly step     = signal<1 | 2>(1); // step1: verify code | step2: new password

  readonly form = this.fb.nonNullable.group({
    email:             [this.route.snapshot.queryParamMap.get('email') || '',
                        [Validators.required, Validators.email]],
    verificationCode:  ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    newPassword:       ['', [Validators.required, Validators.minLength(8),
                             Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/)]],
    confirmNewPassword:['', [Validators.required]],
  }, { validators: passwordMatch });

  get f() { return this.form.controls; }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.message.set('');

    const { email, verificationCode, newPassword, confirmNewPassword } = this.form.getRawValue();

    // Step 1: Verify code
    this.auth.verifyResetCode({ email, verificationCode }).subscribe({
      next: () => {
        // Step 2: Reset password
        this.auth.resetPassword({ email, newPassword, confirmNewPassword }).subscribe({
          next: () => {
            this.success.set(true);
            this.message.set('Password reset successfully! Redirecting to login...');
            setTimeout(() => this.router.navigate(['/auth/login']), 1500);
          },
          error: (err) => {
            this.success.set(false);
            this.message.set(err?.error?.data || 'Could not reset password.');
            this.loading.set(false);
          },
          complete: () => this.loading.set(false),
        });
      },
      error: () => {
        this.success.set(false);
        this.message.set('Invalid verification code. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
