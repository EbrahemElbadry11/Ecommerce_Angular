import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { User } from '../../services/user';
import { ChangeDetectorRef } from '@angular/core';
import { ToastService } from '../../services/toast';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(private fb: FormBuilder, private auth: Auth,private cd: ChangeDetectorRef,private t:ToastService ,private userService: User, private router: Router) {
    this.loginForm = this.fb.group({ 
      email: ['', [Validators.required, Validators.email]], 
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

Login() {
  if (this.loginForm.invalid) {
    this.loginForm.markAllAsTouched(); 
    return;
  }
  this.isLoading = true;
  this.errorMessage = '';
  this.userService.login(this.loginForm.value).subscribe({
    next: (users) => {
      this.isLoading = false;
      if (users.length > 0) {
        if (String(users[0].password) === String(this.loginForm.value.password)) {
           this.auth.setUser(users[0]);
          this.router.navigate(['/home']);
          this.t.show('Login successful!', 'success');
        } else {
          this.errorMessage = 'Incorrect password or email.';
        }
      }else {
        this.cd.detectChanges();
      }
    },
    error: (err) => {
      this.isLoading = false;
      this.errorMessage = 'Something went wrong. Try again.';
      this.cd.detectChanges();

    }
  });
}
}