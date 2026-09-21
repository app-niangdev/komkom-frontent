import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PaymentListFilters, ResponsePaymentList } from 'src/app/interfaces/PaymentList';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private base_url = environment.apiUrl;
  private http = inject(HttpClient);

  list(
    store_id: number,
    filters: PaymentListFilters = {},
    page: number = environment.current_page,
    perPage: number = environment.per_page
  ): Observable<ResponsePaymentList> {
    const params = this.buildParams(store_id, filters)
      .set('page', page.toString())
      .set('perPage', perPage.toString());

    return this.http.get<ResponsePaymentList>(`${this.base_url}/payment/list`, { params });
  }

  /** Le backend renvoie directement le PDF : on récupère un Blob. */
  exportPdf(store_id: number, filters: PaymentListFilters = {}): Observable<Blob> {
    return this.http.get(`${this.base_url}/payment/export-pdf`, {
      params: this.buildParams(store_id, filters),
      responseType: 'blob'
    });
  }

  private buildParams(store_id: number, filters: PaymentListFilters): HttpParams {
    let params = new HttpParams();

    if (store_id) params = params.set('store_id', store_id.toString());
    if (filters.search) params = params.set('search', filters.search);
    if (filters.date) params = params.set('date', filters.date);
    if (filters.start_date) params = params.set('start_date', filters.start_date);
    if (filters.end_date) params = params.set('end_date', filters.end_date);
    if (filters.payment_type) params = params.set('payment_type', filters.payment_type);

    return params;
  }
}
