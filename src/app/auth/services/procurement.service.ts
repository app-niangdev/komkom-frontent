import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AddProcurement,
  ProcurementResponse
} from 'src/app/interfaces/Procurement';
import { ResponseMessage } from 'src/app/response-type/Type';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root'
})
export class ProcurementService {
  private base_url = environment.apiUrl;
  private http = inject(HttpClient);

  list(
    store_id: number,
    searchTerm?: string,
    page: number = environment.current_page,
    perPage: number = environment.per_page,
    start_date?: string,
    end_date?: string
  ): Observable<ProcurementResponse> {
    let params = new HttpParams();

    if (page) params = params.set('page', page.toString());
    if (perPage) params = params.set('per_page', perPage.toString());
    if (searchTerm) params = params.set('search', searchTerm);
    if (store_id) params = params.set('store_id', store_id);
    if (start_date) params = params.set('start_date', start_date);
    if (end_date) params = params.set('end_date', end_date);
    return this.http.get<ProcurementResponse>(
      `${this.base_url}/procurement/list`,
      { params }
    );
  }

  add(data: AddProcurement): Observable<ResponseMessage> {
    return this.http.post<ResponseMessage>(
      `${this.base_url}/procurement/add`,
      data
    );
  }

  update(id: number, data: AddProcurement): Observable<ResponseMessage> {
    return this.http.put<ResponseMessage>(
      `${this.base_url}/procurement/update/${id}`,
      data
    );
  }

  delete(id: number): Observable<ResponseMessage> {
    return this.http.delete<ResponseMessage>(
      `${this.base_url}/procurement/delete/${id}`
    );
  }

  validate(store_id: number, id: number): Observable<ResponseMessage> {
    return this.http.post<ResponseMessage>(
      `${this.base_url}/procurement/validate/${id}`,
      { store_id }
    );
  }

  cancel(store_id: number, id: number): Observable<ResponseMessage> {
    return this.http.post<ResponseMessage>(
      `${this.base_url}/procurement/cancel/${id}`,
      { store_id }
    );
  }
}
