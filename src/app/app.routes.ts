import { Routes } from '@angular/router';
import { Parent } from '../components/parent/parent';
import { Home } from '../components/home/home';
import { Error } from '../components/error/error';
import { Signup } from '../components/signup/signup';
import { Login } from '../components/login/login';
import { Mainlayout } from '../components/mainlayout/mainlayout';
import { Users } from '../components/users/users';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' }, 
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },                   
  {
    path: '',
    component: Mainlayout,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: Home },
      { path: 'parent', component: Parent },
      { path: 'users' , component: Users }
    ],
  },
  { path: '**', component: Error },
];
