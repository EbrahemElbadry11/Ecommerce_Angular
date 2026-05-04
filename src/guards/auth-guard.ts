import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';
import { ToastService } from '../services/toast';

export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  const t = inject(ToastService);

  if (auth.isAdmin()) return true; 

  t.show('Only admin can access this page', 'warning');
  return false;
};
 