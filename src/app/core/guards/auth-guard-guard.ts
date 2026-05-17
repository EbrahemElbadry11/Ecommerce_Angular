import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../modules/auth/services/auth.service';

/**
 * Auth Guard — يسمح فقط للمستخدمين اللي عملوا login
 */
export const authGuard: CanActivateFn = (route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

   if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/auth/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  // ✅ جلب المستخدم الحالي
  const currentUser = auth.session();

  // ✅ فحص الحظر أو الحذف
  if (currentUser?.isBlocked === true || currentUser?.isDeleted === true) {
    auth.logout();
    return router.createUrlTree(['/auth/login']);
  }

  return true;
};

