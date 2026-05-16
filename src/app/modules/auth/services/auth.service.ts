import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiResponse, AuthResponse, ResetPasswordDto, VerifyCodeDto } from '../models/AuthResponse';
import { LoginDto } from '../models/login-dto.model';
import { RegisterDto } from '../models/register-dto.model';

const TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const SESSION_KEY = 'authSession';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly session = signal<AuthResponse | null>(this.readSession());

  constructor(private http: HttpClient, private router: Router) { }

  register(payload: RegisterDto): Observable<ApiResponse<string>> {
    const headers = new HttpHeaders({ 'X-Success-Message': 'Registration successful! Please check your email for confirmation.' });
    return this.http.post<ApiResponse<string>>('/auth/register', payload, { headers });
  }

  login(payload: LoginDto): Observable<ApiResponse<AuthResponse>> {
    const headers = new HttpHeaders({ 'X-Success-Message': 'Login successful! Welcome back.' });
    return this.http.post<ApiResponse<AuthResponse>>('/auth/login', payload, { headers, withCredentials: true }).pipe(
      tap((response) => {
        if (response.data?.token) this.saveSession(response.data);
      })
    );
  }

  confirmEmail(payload: VerifyCodeDto): Observable<ApiResponse<string>> {
    const headers = new HttpHeaders({ 'X-Success-Message': 'Email confirmed successfully! You can now log in.' });
    return this.http.post<ApiResponse<string>>('/auth/confirm-email', payload, { headers });
  }

  resendConfirmation(email: string): Observable<ApiResponse<string>> {
    const headers = new HttpHeaders({ 'X-Success-Message': 'Confirmation email sent! Please check your inbox.' });
    return this.http.post<ApiResponse<string>>('/auth/resend-confirmation', { email }, { headers });
  }

  forgotPassword(email: string): Observable<ApiResponse<string>> {
    const headers = new HttpHeaders({ 'X-Success-Message': 'Password reset email sent! Please check your inbox.' });
    return this.http.post<ApiResponse<string>>('/auth/forget-password', { email }, { headers });
  }

  verifyResetCode(payload: VerifyCodeDto): Observable<ApiResponse<string>> {
    const headers = new HttpHeaders({ 'X-Success-Message': 'Code verified successfully! You can now reset your password.' });
    return this.http.post<ApiResponse<string>>('/auth/verify-reset-code', payload, { headers });
  }

  resetPassword(payload: ResetPasswordDto): Observable<ApiResponse<string>> {
    const headers = new HttpHeaders({ 'X-Success-Message': 'Password reset successfully! You can now log in with your new password.' });
    return this.http.post<ApiResponse<string>>('/auth/reset-password', payload, { headers });
  }

  refreshToken(): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>('/auth/refresh-token', {
      token: this.token,
      refreshToken: this.refreshTokenValue,
    }).pipe(
      tap((response) => {
        if (response.data?.token)
          this.saveSession({ ...this.session()!, ...response.data });
      })
    );
  }

  logout(): void {
    this.http.post('/auth/logout', {}).subscribe({ error: () => undefined });
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
    this.session.set(null);
    this.router.navigate(['/auth/login']);
  }

  get token(): string | null { return localStorage.getItem(TOKEN_KEY); }
  get refreshTokenValue(): string | null { return localStorage.getItem(REFRESH_TOKEN_KEY); }
  isLoggedIn(): boolean { return !!this.token; }
  hasRole(role: string): boolean { return this.session()?.role === role; }
  getUserRole(): string { return this.session()?.role ?? ''; }

  private saveSession(session: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, session.token);
    if (session.refreshToken)
      localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    this.session.set(session);
  }

  private readSession(): AuthResponse | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
}
