import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Category, CategoryResponse } from 'src/app/interfaces/Category';
import {
  PayloadUpdateSerialNumber,
  SerialNumber,
  SerialNumberResponse
} from 'src/app/interfaces/SerialNumber';
import { ResponseMessage } from 'src/app/response-type/Type';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmeiService {
  private base_url = environment.apiUrl;
  private http = inject(HttpClient);

  list(
    store_id: number,
    product_id?: number,
    searchTerm?: string,
    page: number = environment.current_page,
    perPage: number = environment.per_page
  ): Observable<SerialNumberResponse> {
    let params = new HttpParams();

    if (page) params = params.set('page', page.toString());
    if (perPage) params = params.set('per_page', perPage.toString());
    if (searchTerm) params = params.set('search', searchTerm);
    if (store_id) params = params.set('store_id', store_id);
    if (product_id) params = params.set('product_id', product_id);
    return this.http.get<SerialNumberResponse>(`${this.base_url}/imei/list`, {
      params
    });
  }

  add(data: Category): Observable<ResponseMessage> {
    return this.http.post<ResponseMessage>(
      `${this.base_url}/category/add`,
      data
    );
  }

  update(
    id: number,
    data: PayloadUpdateSerialNumber
  ): Observable<ResponseMessage> {
    return this.http.put<ResponseMessage>(
      `${this.base_url}/imei/update/${id}`,
      data
    );
  }

  delete(id: number): Observable<ResponseMessage> {
    return this.http.delete<ResponseMessage>(
      `${this.base_url}/category/delete/${id}`
    );
  }
}
