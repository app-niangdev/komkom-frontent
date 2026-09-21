import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ResponseAppSetting, ResponseMessage } from 'src/app/response-type/Type';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SettingService {
  private base_url = environment.apiUrl;
  private http = inject(HttpClient);

  getDataApplicationSetting():Observable<ResponseAppSetting>{
    return this.http.get<ResponseAppSetting>(this.base_url + '/app-setting');
  }

  updateApplicationSetting(id:number, data:FormData):Observable<ResponseMessage>{
    return this.http.post<ResponseMessage>(`${this.base_url}/update-app-setting/${id}`, data);
  }
}
