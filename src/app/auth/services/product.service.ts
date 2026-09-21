import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductResponse } from 'src/app/interfaces/Product';
import { ResponseMessage } from 'src/app/response-type/Type';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private base_url = environment.apiUrl;
  private http = inject(HttpClient);

  list(
    store_id: number,
    category_id: number | null,
    searchTerm?: string,
    page: number = environment.current_page,
    perPage: number = 16
  ): Observable<ProductResponse> {
    let params = new HttpParams();

    if (page) params = params.set('page', page.toString());
    if (perPage) params = params.set('per_page', perPage.toString());
    if (searchTerm) params = params.set('search', searchTerm);
    if (store_id) params = params.set('store_id', store_id);
    if (category_id) params = params.set('category_id', category_id);
    return this.http.get<ProductResponse>(`${this.base_url}/product/list`, {
      params
    });
  }

  available(
    store_id: number,
    category_id: number | null,
    searchTerm?: string,
    page: number = environment.current_page,
    perPage: number = environment.per_page
  ): Observable<ProductResponse> {
    let params = new HttpParams();

    if (page) params = params.set('page', page.toString());
    if (perPage) params = params.set('per_page', perPage.toString());
    if (searchTerm) params = params.set('search', searchTerm);
    if (store_id) params = params.set('store_id', store_id);
    if (category_id) params = params.set('category_id', category_id);
    return this.http.get<ProductResponse>(
      `${this.base_url}/product/available`,
      { params }
    );
  }

  add(data: FormData): Observable<ResponseMessage> {
    return this.http.post<ResponseMessage>(
      `${this.base_url}/product/add`,
      data
    );
  }

  update(id: number, data: FormData): Observable<ResponseMessage> {
    return this.http.post<ResponseMessage>(
      `${this.base_url}/product/update/${id}`,
      data
    );
  }

  delete(id: number): Observable<ResponseMessage> {
    return this.http.delete<ResponseMessage>(
      `${this.base_url}/product/delete/${id}`
    );
  }
}
