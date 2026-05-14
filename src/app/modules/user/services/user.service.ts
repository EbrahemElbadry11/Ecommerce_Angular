import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, UpdateProfileRequest, UserProfile } from '../models/user-profile.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}

  getProfile(): Observable<ApiResponse<UserProfile>> {
    return this.http.get<ApiResponse<UserProfile>>('/user/profile');
  }

  updateProfile(payload: UpdateProfileRequest): Observable<ApiResponse<string>> {
    const form = new FormData();
    if (payload.fullName)    form.append('FullName',    payload.fullName);
    if (payload.phoneNumber) form.append('PhoneNumber', payload.phoneNumber);
    if (payload.address)     form.append('Address',     payload.address);
    if (payload.image)       form.append('Image',       payload.image);
    const headers = new HttpHeaders({ 'X-Success-Message': 'Profile updated successfully!' });
    return this.http.put<ApiResponse<string>>('/user/update-profile', form, { headers });
  }
}
