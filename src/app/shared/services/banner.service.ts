import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ibanner } from '../../../models/ibanner';
import { GeneralResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class BannerService {
  private readonly endpoint = '/Banner';

  constructor(private http: HttpClient) {}

  /**
   * Get all active banners (public)
   * GET /api/Banner
   */
  getActiveBanners(): Observable<GeneralResponse<Ibanner[]>> {
    return this.http.get<GeneralResponse<Ibanner[]>>(this.endpoint);
  }

  /**
   * Get all banners (admin)
   * GET /api/Banner/all
   */
  getAllBanners(): Observable<GeneralResponse<Ibanner[]>> {
    return this.http.get<GeneralResponse<Ibanner[]>>(`${this.endpoint}/all`);
  }

  /**
   * Get banner by id
   * GET /api/Banner/{id}
   */
  getBannerById(id: number): Observable<GeneralResponse<Ibanner>> {
    return this.http.get<GeneralResponse<Ibanner>>(`${this.endpoint}/${id}`);
  }
}
