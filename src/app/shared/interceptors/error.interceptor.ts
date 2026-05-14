// src/app/core/interceptors/error.interceptor.ts
import { Injectable, signal } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
    

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
      readonly message  = signal('');

  constructor(private router: Router,) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          localStorage.removeItem('userToken');
          this.router.navigate(['/login']);
        }
        const errorMessage = error.error.message || 'An unexpected error occurred';
        this.message.set(errorMessage);
        console.error(errorMessage);
        return throwError(() => error);
      })
    );
  }
}