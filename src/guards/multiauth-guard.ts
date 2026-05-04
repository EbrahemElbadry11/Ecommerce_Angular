import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';
import { ToastService } from '../services/toast';

export const multiauthGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  const t = inject(ToastService);

  if (auth.isLoggedIn()) return true; 

  t.show('You must login first', 'warning');
  return router.createUrlTree(['/home']);
};