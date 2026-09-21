import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RoleResponse } from 'src/app/interfaces/Role';
import { User, UserResponse } from 'src/app/interfaces/User';
import { ResponseMessage } from 'src/app/response-type/Type';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private base_url = environment.apiUrl;
  private http = inject(HttpClient);

  getUsers(
    searchTerm?: string,
    page?: number,
    perPage?: number,
    searchStatus?: string
  ): Observable<UserResponse> {
    let params = new HttpParams();

    if (page) params = params.set('page', page.toString());
    if (perPage) params = params.set('per_page', perPage.toString());
    if (searchTerm) params = params.set('search', searchTerm);
    if (searchStatus) params = params.set('searchStatus', searchStatus);

    return this.http.get<UserResponse>(`${this.base_url}/user/list`, { params });
  }

  disableUser(id:number):Observable<ResponseMessage>{
    return this.http.get<ResponseMessage>(`${this.base_url}/user/disable/${id}`);
  }

  addUser(data:User):Observable<ResponseMessage>{
    return this.http.post<ResponseMessage>(`${this.base_url}/user/add`, data);
  }

  updateUser(id:number, data:User):Observable<ResponseMessage>{
    return this.http.put<ResponseMessage>(`${this.base_url}/user/update/${id}`, data);
  }

  updateUserProfile(id:number, data:FormData):Observable<ResponseMessage>{
    return this.http.post<ResponseMessage>(`${this.base_url}/user/update/${id}`, data);
  }

  deleteUser(id:number):Observable<ResponseMessage>{
    return this.http.delete<ResponseMessage>(`${this.base_url}/user/delete/${id}`);
  }

  getRoles():Observable<RoleResponse>{
    return this.http.get<RoleResponse>(`${this.base_url}/roles`);
  }

}
