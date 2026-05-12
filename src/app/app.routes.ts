import { Routes } from '@angular/router';
import { Parent } from '../components/parent/parent';
import { Home } from '../components/home/home';
import { Error } from '../components/error/error';
import { Signup } from '../components/signup/signup';
import { Login } from '../components/login/login';
import { Mainlayout } from '../components/mainlayout/mainlayout';
import { Users } from '../components/users/users';
import { authGuard } from '../guards/auth-guard';
import { multiauthGuard } from '../guards/multiauth-guard';
import { Dashboard } from '../components/dashboard/dashboard';
import { ProductListComponent } from './modules/products/components/product-list/product-list.component';
import { ProductDetailComponent } from './modules/products/components/product-detail/product-detail.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' }, 
  { path: 'login', component: Login },                 
  { path: 'signup', component: Signup },
  {
    path: '',
    component: Mainlayout,
   
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: Home },
      { path: 'products', component: ProductListComponent },
      { path: 'products/:id', component: ProductDetailComponent },
      { path: 'parent', component: Parent , canActivate: [multiauthGuard]},
      { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },    ],
  },
  { path: '**', component: Error },
];
