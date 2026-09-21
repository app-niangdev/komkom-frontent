import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ResponseMessage } from '../../response-type/Type';
import { Observable } from 'rxjs';
import { ResponseInvoice } from 'src/app/interfaces/Invoice';
import { DetailPayment, Payment } from 'src/app/interfaces/Payment';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  constructor(private http: HttpClient) {}

  private base_url = environment.apiUrl;

  list(
    store_id: number,
    searchTerm?: string,
    status?: string,
    page: number = environment.current_page,
    perPage: number = environment.per_page
  ): Observable<ResponseInvoice> {
    let params = new HttpParams();

    if (page) params = params.set('page', page.toString());
    if (perPage) params = params.set('per_page', perPage.toString());
    if (searchTerm) params = params.set('search', searchTerm);
    if (status) params = params.set('status', status);
    if (store_id) params = params.set('store_id', store_id);
    return this.http.get<ResponseInvoice>(`${this.base_url}/invoice/list`, {
      params
    });
  }

  addPayment(payment: Payment, id: number): Observable<ResponseMessage> {
    return this.http.post<ResponseMessage>(
      `${this.base_url}/invoice/paid/${id}`,
      payment
    );
  }

  detailsPayment(id: number): Observable<DetailPayment> {
    return this.http.get<DetailPayment>(
      `${this.base_url}/invoice/receipt/${id}`
    );
  }

  downloadInvoicePdf(id: number): Observable<Blob> {
    const url = `${this.base_url}/invoice/${id}/pdf/download`;
    return this.http.get(url, {
      responseType: 'blob'
    });
  }

  getInvoiceDetails(id: number): Observable<DetailPayment> {
    return this.http.get<DetailPayment>(
      `${this.base_url}/invoice/${id}/details`
    );
  }

  // /invoice/1/pdf/view
}
