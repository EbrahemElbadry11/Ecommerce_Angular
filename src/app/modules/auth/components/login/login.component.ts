// login.component.ts - النسخة النهائية
import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../../../../services/toast'; 


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: '../auth-shared.css',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService); 


  readonly loading = signal(false);
  readonly message = signal('');
  readonly showPass = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  get email() { return this.form.controls.email; }
  get password() { return this.form.controls.password; }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.message.set('');

    this.auth.login(this.form.getRawValue()).subscribe({
      next: (res) => {
        if (!res?.data) {
          this.message.set('Invalid response from server');
          this.loading.set(false);
          return;
        }

        const user = res.data;

        // فحص الحظر
        if (user.isBlocked === true) {
          this.message.set('⛔ Your account has been blocked. Please contact support.');
          this.loading.set(false);
          return;
        }

        // فحص الحذف
        if (user.isDeleted === true) {
          this.message.set('❌ Your account has been deleted.');
          this.loading.set(false);
          return;
        }

        // الحساب سليم - حفظ البيانات
        if (user.token) {
          localStorage.setItem('authToken', user.token);
          if (user.refreshToken) localStorage.setItem('refreshToken', user.refreshToken);
          localStorage.setItem('authSession', JSON.stringify(user));
          this.auth.session.set(user);
        }

        // التوجيه حسب الدور
        const role = user.role;
        if (role === 'Admin') {
          this.toast.show('Login successful! Welcome back.', 'success'); 
          this.router.navigate(['/admin/dashboard']);
        } else {
         this.toast.show('Login successful! Welcome back.', 'success'); 
          this.router.navigate(['/home']);
        }

        this.loading.set(false);
      },
      error: (err) => {
        console.error('Login error:', err);
        this.message.set(err?.error?.data || 'Invalid email or password.');
        this.loading.set(false);
      }
    });
  }
  
}