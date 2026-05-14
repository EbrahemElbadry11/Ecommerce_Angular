import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Darkmode } from '../../directives/darkmode';
import { RouterLink, Router, RouterLinkActive } from "@angular/router";
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, Darkmode, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {
  isLogged: boolean = false;
  isAdmin: boolean = false;
  isSeller: boolean = false;
  userFullName: string = '';
  userInitial: string = '';
  isScrolled: boolean = false;

  constructor(private userAuth: Auth, private router: Router) {}

  ngOnInit(): void {
    this.updateAuthStatus();
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', () => {
        this.isScrolled = window.scrollY > 20;
      });
    }
  }

  private updateAuthStatus(): void {
    this.isLogged = this.userAuth.isLoggedIn();
    this.isAdmin = this.userAuth.isAdmin();
    
    const user = this.userAuth.getUser();
    // تأكد من أن الأدوار تُقرأ بشكل صحيح من الـ Auth Service
    this.isSeller = user?.role === 'Seller'; 
    
    this.userFullName = user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user?.userName || 'User';
      
    this.userInitial = this.userFullName.charAt(0).toUpperCase();
  }

  logout(): void {
    this.userAuth.logout();
    this.updateAuthStatus();
    this.router.navigate(['/auth/login']);
  }
}