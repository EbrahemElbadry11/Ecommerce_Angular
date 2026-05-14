import { Injectable, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, catchError, tap } from 'rxjs';
import { ToastService } from '../../../services/toast';

/**
 * API Interceptor
 * Adds authentication token and API base URL to all requests
 * Also handles CORS and content-type headers
 * Displays toast notifications for successes and failures
 */
@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  // Update this to match your API server URL
  private readonly API_BASE_URL = 'https://ecommerceiti.runasp.net/api';
  private readonly toastService = inject(ToastService);

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // Skip interceptor for external URLs (if needed)
    if (!request.url.startsWith('http')) {
      // Prepend API base URL to relative URLs
      request = request.clone({
        url: `${this.API_BASE_URL}${request.url}`,
      });
    }

    // Get JWT token from localStorage
    const token = localStorage.getItem('authToken');

    // Add Authorization header if token exists
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    // Add Content-Type for JSON (if not already set)
    if (
      !request.headers.has('Content-Type') &&
      !(request.body instanceof FormData)
    ) {
      request = request.clone({
        setHeaders: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Remove Content-Type for FormData (browser will set it with boundary)
    if (request.body instanceof FormData) {
      request = request.clone({
        headers: request.headers.delete('Content-Type'),
      });
    }

    return next.handle(request).pipe(
      tap((event) => {
        if (
          event instanceof HttpResponse &&
          ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)
        ) {
          const customMessage = request.headers.get('X-Success-Message');
          const message = customMessage || 'Action completed successfully.';
          this.toastService.show(message, 'success');
        }
      }),
      catchError((error: HttpErrorResponse) => {
        const message =
          error.error?.message ||
          error.error?.data   ||
          error.statusText    ||
          'Something went wrong. Please try again.';
        this.toastService.show(message, 'danger');
        return throwError(() => error);
      })
    );
  }
}
