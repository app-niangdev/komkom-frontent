import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { ReportingResponse } from 'src/app/interfaces/ReportinData';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportingService {
  constructor(private http: HttpClient) {}

  private base_url = environment.apiUrl;

  getReportingSale(
    store_id?: number,
    params?: {
      start_date?: string;
      end_date?: string;
      year?: number;
    }
  ): Observable<ReportingResponse> {
    const queryArray: string[] = [];

    if (store_id) {
      queryArray.push(`store_id=${store_id}`);
    }

    if (params) {
      if (params.start_date) {
        queryArray.push(`start_date=${params.start_date}`);
      }

      if (params.end_date) {
        queryArray.push(`end_date=${params.end_date}`);
      }

      if (params.year) {
        queryArray.push(`year=${params.year}`);
      }
    }

    const queryParams = queryArray.length > 0 ? '?' + queryArray.join('&') : '';

    return this.http.get<ReportingResponse>(
      `${this.base_url}/reporting${queryParams}`
    );
  }
}
