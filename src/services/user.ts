import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class User {

  basurleUrl = 'http://localhost:3000/users';

  constructor(private http: HttpClient) {}

  getAllUsers() {
    return this.http.get<any[]>(this.basurleUrl);
  }

  addUser(user: any) {
    return this.http.get<any[]>(this.basurleUrl).pipe(
      switchMap((users) => {
        const lastId = users.length > 0 ? Math.max(...users.map(u => Number(u.id))) : 0;
        const newUser = {
          ...user,
          id: lastId + 1,
          password: String(user.password)
        };
        return this.http.post(this.basurleUrl, newUser);
      })
    );
  }

  deleteUser(id: number) {
    return this.http.delete(`${this.basurleUrl}/${id}`);
  }

  login(credentials: { email: string; password: string }) {
    return this.http.get<any[]>(`${this.basurleUrl}?email=${credentials.email}`);
  }
}