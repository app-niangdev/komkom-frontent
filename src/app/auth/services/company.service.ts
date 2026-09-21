import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CompanyResponse, RequestCompanyOwner } from 'src/app/interfaces/Company';
import { Store, StoreResponse } from 'src/app/interfaces/Store';
import { ResponseMessage } from 'src/app/response-type/Type';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private base_url = environment.apiUrl;
  private http = inject(HttpClient);

  getCompanies(searchTerm: string, page: number = environment.current_page, perPage: number=environment.per_page, searchStatus: string):Observable<CompanyResponse>{
    const params = { params: { page: `${page}`, perPage: `${perPage}` } };
    let url = `${this.base_url}/company/list`;
    if (searchTerm) {
      url += `?search=${searchTerm}`;
    }
    if (searchStatus) {
      url += `?searchStatus=${searchStatus}`;
    }
    return this.http.get<CompanyResponse>(url, params);
  }

  getStoresCompany(
      id: number,
      searchTerm: string,
      page: number,
      perPage: number=environment.per_page,
      searchStatus: string):Observable<StoreResponse>{
    const params = { params: { page: `${page}`, perPage: `${perPage}` } };
    let url = `${this.base_url}/store/list/${id}`;
    if (searchTerm) {
      url += `?search=${searchTerm}`;
    }
    if (searchStatus) {
      url += `?searchStatus=${searchStatus}`;
    }
    return this.http.get<StoreResponse>(url, params);
  }

  addCompany(data:RequestCompanyOwner):Observable<ResponseMessage>{
    return this.http.post<ResponseMessage>(`${this.base_url}/company/add`, data);
  }

  updateCompany(id:number, data:RequestCompanyOwner):Observable<ResponseMessage>{
    return this.http.put<ResponseMessage>(`${this.base_url}/company/update/${id}`, data);
  }

  addStore(data:Store):Observable<ResponseMessage>{
    return this.http.post<ResponseMessage>(`${this.base_url}/store/add`, data);
  }

  updateStore(id:number, data:Store):Observable<ResponseMessage>{
    return this.http.put<ResponseMessage>(`${this.base_url}/store/update/${id}`, data);
  }

  addStoreWithBranding(data:FormData):Observable<ResponseMessage>{
    return this.http.post<ResponseMessage>(`${this.base_url}/store/add`, data);
  }

  updateStoreWithBranding(id:number, data:FormData):Observable<ResponseMessage>{
    data.append('_method', 'PUT');
    return this.http.post<ResponseMessage>(`${this.base_url}/store/update/${id}`, data);
  }

  changeStatus(id:number):Observable<ResponseMessage>{
    return this.http.get<ResponseMessage>(`${this.base_url}/store/change-status/${id}`);
  }

  updateOnlyCompany(id:number, data:FormData):Observable<ResponseMessage>{
    return this.http.post<ResponseMessage>(`${this.base_url}/company/update-info-company/${id}`, data);
  }
}
