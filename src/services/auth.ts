import { Injectable } from '@angular/core';

const AUTH_SESSION_KEY = 'authSession';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private adminEmail = 'ali@gmail.com';

  setUser(user: any) {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
  }

  getUser() {
    return JSON.parse(localStorage.getItem(AUTH_SESSION_KEY) || 'null');
  }

  isLoggedIn(): boolean {
    return !!this.getUser();
  }

  isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === 'Admin' || user?.email === this.adminEmail;
  }

  logout() {
    localStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
  }
}
