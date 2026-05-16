import { Routes } from '@angular/router';
import { Home } from '../components/home/home';
import { Error } from '../components/error/error';
import { Mainlayout } from '../components/mainlayout/mainlayout';
import { authGuard } from './core/guards/auth-guard-guard';
import { roleGuard } from './core/guards/roleguard-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // Auth pages (no layout)
  { path: 'auth/login', loadComponent: () => import('./modules/auth/components/login/login.component').then(m => m.LoginComponent) },
  { path: 'auth/register', loadComponent: () => import('./modules/auth/components/register/register.component').then(m => m.RegisterComponent) },
  { path: 'auth/confirm-email', loadComponent: () => import('./modules/auth/components/email-confirmation/email-confirmation.component').then(m => m.EmailConfirmationComponent) },
  { path: 'auth/forgot-password', loadComponent: () => import('./modules/auth/components/forget-password/forget-password.component').then(m => m.ForgetPasswordComponent) },
  { path: 'auth/reset-password', loadComponent: () => import('./modules/auth/components/reset-password/reset-password.component').then(m => m.ResetPasswordComponent) },

  // Redirects
  { path: 'login', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: 'signup', redirectTo: 'auth/register', pathMatch: 'full' },
  { path: 'dashboard', redirectTo: 'admin/dashboard', pathMatch: 'full' },

  // Main layout
  {
    path: '',
    component: Mainlayout,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: Home },

      // Products CRUD (Seller / Admin only)
      {
        path: 'products/create',
        loadComponent: () =>
          import('./modules/products/components/product-create-page/product-create-page.component')
            .then(m => m.ProductCreatePageComponent),

        canActivate: [authGuard, roleGuard],

        data: {
          roles: ['Seller', 'Admin']
        },
      },

      {
        path: 'products/:id/edit',
        loadComponent: () =>
          import('./modules/products/components/product-edit-page/product-edit-page.component')
            .then(m => m.ProductEditPageComponent),

        canActivate: [authGuard, roleGuard],

        data: {
          roles: ['Seller', 'Admin']
        },
      },

      // Products (public)
      {
        path: 'products',
        loadComponent: () =>
          import('./modules/products/components/product-list/product-list.component')
            .then(m => m.ProductListComponent)
      },

      {
        path: 'products/:id',
        loadComponent: () =>
          import('./modules/products/components/product-detail/product-detail.component')
            .then(m => m.ProductDetailComponent)
      },

      // Categories (public)
      { path: 'categories', loadComponent: () => import('./modules/categories/components/category-list/category-list.component').then(m => m.CategoryListComponent) },
      { path: 'categories/:id', loadComponent: () => import('./modules/categories/components/category-detail/category-detail.component').then(m => m.CategoryDetailComponent) },

      // Seller pages (logged-in users)
      {
        path: 'sellers/register',
        loadComponent: () => import('./modules/sellers/components/seller-register-page/seller-register-page.component').then(m => m.SellerRegisterPageComponent),
        canActivate: [authGuard],
      },
      {
        path: 'sellers/profile',
        loadComponent: () => import('./modules/sellers/components/seller-profile-page/seller-profile-page.component').then(m => m.SellerProfilePageComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['Seller', 'Admin'] },
      },
      {
        path: 'sellers/dashboard',
        loadComponent: () => import('./modules/sellers/components/seller-dashboard/seller-dashboard.component').then(m => m.SellerDashboardComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['Seller', 'Admin'] },
      },

      // Admin pages (Admin only)
      {
        path: 'admin/dashboard',
        loadComponent: () => import('./modules/admin/components/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['Admin'] },
      },
      {
        path: 'admin/users',
        loadComponent: () => import('./modules/admin/components/user-management/user-management.component').then(m => m.UserManagementComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['Admin'] },
      },
      {
        path: 'admin/seller-approval',
        loadComponent: () => import('./modules/admin/components/seller-approval/seller-approval/seller-approval').then(m => m.SellerApprovalComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['Admin'] },
      },

      // User profile (any logged-in user)
      {
        path: 'user/profile',
        loadComponent: () => import('./modules/user/components/user-profile/user-profile.component').then(m => m.UserProfileComponent),
        canActivate: [authGuard],
      },
      {
        path: 'cart',
        loadComponent: () =>
          import('./modules/cart/components/cart.component/cart.component')
            .then(m => m.CartComponent)
      },
      {
        path: 'checkout',
        loadComponent: () =>
          import(
            './modules/checkout/components/checkout-page/checkout-page'
          ).then(
            m => m.CheckoutPageComponent
          )
      },
      {
        path: 'payment-success',
        loadComponent: () =>
          import(
            './modules/checkout/components/payment-success/payment-success'
          ).then(
            m => m.PaymentSuccess
          )
      }
      ,
      // User orders (customer)
      {
        path: 'user/orders',
        loadComponent: () => import('./modules/user/components/user-orders/user-orders.component').then(m => m.UserOrdersComponent),

      },
    ],
  },

  { path: '**', component: Error },
];
