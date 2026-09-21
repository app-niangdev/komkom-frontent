import { inject, Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Injectable()
export class JwtRefreshInterceptor implements HttpInterceptor {
  private router = inject(Router);
  private http = inject(HttpClient);
  private isRefreshing = false;
  private refreshedSubject = new BehaviorSubject<boolean | null>(null);

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        const isAuthEndpoint =
          request.url.includes('/login') || request.url.includes('/refresh');

        if (error.status !== 401 || isAuthEndpoint) {
          return throwError(() => error);
        }

        return this.handleUnauthorized(request, next);
      })
    );
  }

  private handleUnauthorized(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    if (this.isRefreshing) {
      return this.refreshedSubject.pipe(
        filter((result) => result !== null),
        take(1),
        switchMap((success) => {
          if (!success) {
            return throwError(() => new Error('Session expirée'));
          }
          return next.handle(request);
        })
      );
    }

    this.isRefreshing = true;
    this.refreshedSubject.next(null);

    return this.http
      .post(`${environment.apiUrl}/refresh`, {}, { withCredentials: true })
      .pipe(
        switchMap(() => {
          this.isRefreshing = false;
          this.refreshedSubject.next(true);
          return next.handle(request);
        }),
        catchError((refreshError) => {
          this.isRefreshing = false;
          this.refreshedSubject.next(false);
          this.router.navigate(['/login']);
          return throwError(() => refreshError);
        })
      );
  }
}
