import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private adminEmail = 'ali@gmail.com'; 

  setUser(user: any) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  getUser() {
    return JSON.parse(localStorage.getItem('user') || 'null');
  }

  isLoggedIn(): boolean {
    return !!this.getUser();
  }

  isAdmin(): boolean {
    return this.getUser()?.email === this.adminEmail; 
  }

  logout() {
    localStorage.removeItem('user');
  }
}
