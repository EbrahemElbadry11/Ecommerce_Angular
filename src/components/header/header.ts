import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, RouterLinkActive, NavigationEnd } from '@angular/router';
import { AuthService } from '../../app/modules/auth/services/auth.service';
import { ThemeService } from '../../app/shared/services/ThemeService';
import { CartService } from '../../app/modules/cart/services/cart.service';
import { Subject, filter, takeUntil } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit, OnDestroy {
  isLogged: boolean = false;
  isAdmin: boolean = false;
  isSeller: boolean = false;
  isCustomer: boolean = false;
  userFullName: string = '';
  userInitial: string = '';
  userRole: string = '';
  isScrolled: boolean = false;
  isDarkMode: boolean = false;
  cartCount: number = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router,
    private themeService: ThemeService,
    private cartService: CartService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.updateAuthStatus();

    this.router.events
      .pipe(
        filter(e => e instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updateAuthStatus();
        this.cdr.markForCheck();
      });

    this.isDarkMode = this.themeService.isDarkMode();

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', () => {
        this.isScrolled = window.scrollY > 20;
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
    this.isDarkMode = this.themeService.isDarkMode();
  }

  private updateAuthStatus(): void {
    this.isLogged   = this.authService.isLoggedIn();
    const session   = this.authService.session();
    this.userRole   = session?.role ?? '';
    this.isAdmin    = this.userRole === 'Admin';
    this.isSeller   = this.userRole === 'Seller';
    this.isCustomer = this.isLogged && !this.isAdmin && !this.isSeller;

    this.userFullName = session?.fullName || session?.email || 'User';
    this.userInitial  = this.userFullName.charAt(0).toUpperCase();

    if (this.isLogged && !this.isAdmin) {
      this.loadCartCount();
    }
  }

  private loadCartCount(): void {
    this.cartService.getCart().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.cartCount = res.data.items?.length ?? 0;
          this.cdr.markForCheck();
        }
      },
      error: () => { this.cartCount = 0; },
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
