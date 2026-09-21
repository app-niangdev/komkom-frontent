import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmailVerifyService {
  urlApi = environment.apiUrl;
  private dataSubject = new BehaviorSubject<any>(null);
  public data$ = this.dataSubject.asObservable();

  constructor(private http: HttpClient) {}

  setData(data: any) {
    this.dataSubject.next(data);
  }

  verify(id: number, hash: string, expires: any, signature: any) {
    const params = new HttpParams()
      .set('expires', expires)
      .set('signature', signature);

    return this.http.get(`${this.urlApi}/email/verify/${id}/${hash}`, {
      params
    });
  }
}
