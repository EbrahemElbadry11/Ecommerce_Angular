import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../modules/auth/services/auth.service';

/**
 * Role Guard — يسمح فقط للأدوار المحددة
 * الاستخدام: canActivate: [roleGuard], data: { roles: ['Admin'] }
 */
export const roleGuard: CanActivateFn = (route) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = route.data['roles'] as string[] | undefined;
  const userRole      = auth.getUserRole();

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/auth/login']);
  }

  if (!requiredRoles || requiredRoles.includes(userRole)) {
    return true;
  }

  return router.createUrlTree(['/home']);
};
