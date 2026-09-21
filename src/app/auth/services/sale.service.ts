import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ResponseMessage } from 'src/app/response-type/Type';
import { SaleDetailsResponse } from 'src/app/interfaces/Sale';

export interface SaleItem {
  product_id: number;
  quantity: number;
  unit_price_at_sale: number;
  subtotal?: number;
  serial_numbers?: string[];  // Numéros de série en string
  unit_of_measure_id?: number;  // ID de l'unité de mesure utilisée
  base_unit_quantity?: number;  // Quantité convertie en unité de base
}

export interface CustomerSale {
  name: string;
  phone: string;
}

export interface PaymentData {
  payment_type: 'cash' | 'wave' | 'OM';
  phone_number?: string;
  amount: number;
}

export interface NewSale {
  store_id?: number;
  customer_type: 'existing' | 'new' | 'anonymous';
  customer_id?: number;
  new_customer?: CustomerSale;
  discount: number;
  items: SaleItem[];
  payment?: PaymentData;
}

export interface PaymentMethod {
  value: 'cash' | 'wave' | 'OM';
  label: string;
  image: string;
}

export interface SaleResponse {
  message: string;
  sale_id?: number;
  sale_number?: string;
  sale_status?: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class SaleService {
  private base_url = environment.apiUrl;
  constructor(private http: HttpClient) {}

  addSale(saleData: NewSale): Observable<SaleResponse> {
    return this.http.post<ResponseMessage>(`${this.base_url}/sale/add`, saleData);
  }

  list(
    store_id: number,
    searchTerm?: string,
    page: number = environment.current_page,
    perPage: number = environment.per_page,
  ): Observable<any> {
    let params = new HttpParams();

    if (page) params = params.set('page', page.toString());
    if (perPage) params = params.set('per_page', perPage.toString());
    if (searchTerm) params = params.set('search', searchTerm);
    if (store_id) params = params.set('store_id', store_id);
    return this.http.get<any>(`${this.base_url}/sale/list`, { params });
  }

  getSaleById(id: number): Observable<SaleDetailsResponse> {
    return this.http.get<SaleDetailsResponse>(`${this.base_url}/sale/show/${id}`);
  }

  validateSale(id: number, store_id: number, payment?: PaymentData): Observable<ResponseMessage>{
    return this.http.post<ResponseMessage>(`${this.base_url}/sale/validate/${id}`, { store_id, payment });
  }

  CancelSale(id:number,store_id: number): Observable<ResponseMessage>{
    return this.http.post<ResponseMessage>(`${this.base_url}/sale/cancel/${id}`, {store_id});
  }


}
