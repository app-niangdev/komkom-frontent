import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Supplier, SupplierResponse } from 'src/app/interfaces/Supplier';
import { ResponseMessage } from 'src/app/response-type/Type';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private base_url = environment.apiUrl;
  private http = inject(HttpClient);

  getSupplier(
    store_id: number,
    searchTerm?: string,
    page: number = environment.current_page,
    perPage: number = environment.per_page,
  ): Observable<SupplierResponse> {
    let params = new HttpParams();

    if (page) params = params.set('page', page.toString());
    if (perPage) params = params.set('per_page', perPage.toString());
    if (searchTerm) params = params.set('search', searchTerm);
    if (store_id) params = params.set('store_id', store_id);
    return this.http.get<SupplierResponse>(`${this.base_url}/supplier/list`, { params });
  }

  add(data:Supplier):Observable<ResponseMessage>{
    return this.http.post<ResponseMessage>(`${this.base_url}/supplier/add`, data);
  }

  update(id:number, data:Supplier):Observable<ResponseMessage>{
    return this.http.put<ResponseMessage>(`${this.base_url}/supplier/update/${id}`, data);
  }

  delete(id:number):Observable<ResponseMessage>{
    return this.http.delete<ResponseMessage>(`${this.base_url}/supplier/delete/${id}`);
  }

}
