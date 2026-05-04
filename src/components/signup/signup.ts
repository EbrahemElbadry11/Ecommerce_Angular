import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { User } from '../../services/user';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '../../services/toast';
declare var bootstrap: any;

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  userRegister: FormGroup;

  constructor(private fb: FormBuilder, private userr: User, private router: Router,private t:ToastService) {
    this.userRegister = fb.group({
      name: ['', [Validators.required, Validators.pattern('[A-Za-z]+')]],
      age: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmedpassword: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern('[0-9]{11}')]]
    });
  }

  AddUser() {
  if (this.userRegister.invalid) {
    this.userRegister.markAllAsTouched();
    return;
  }

  const userData = {
    ...this.userRegister.value,
    password: String(this.userRegister.value.password), 
  };

  this.userr.addUser(userData).subscribe({
    next: () => {
      this.userRegister.reset();
      this.t.show('User registered successfully!', 'success');
      setTimeout(() => this.router.navigate(['/login']), 2000);
    },
    error: (err) => console.error('Error adding user:', err)
  });
}
}