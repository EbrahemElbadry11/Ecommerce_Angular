import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: '../auth-shared.css',
})
export class LoginComponent {
  private readonly fb     = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth   = inject(AuthService);

  readonly loading  = signal(false);
  readonly message  = signal('');
  readonly showPass = signal(false);

  readonly form = this.fb.nonNullable.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  get email()    { return this.form.controls.email; }
  get password() { return this.form.controls.password; }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading.set(true);
    this.message.set('');

    this.auth.login(this.form.getRawValue()).subscribe({
      next: (res) => {
        const role = res.data?.role;
        if (role === 'Admin') this.router.navigate(['/admin/dashboard']);
        else                  this.router.navigate(['/home']);
      },
      error: (err) => {
        this.message.set(err?.error?.data || 'Invalid email or password.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }
}
