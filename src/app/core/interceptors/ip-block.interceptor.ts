import { inject, Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  IpBlockedError,
  IpBlockService
} from 'src/app/auth/services/ip-block.service';

/**
 * Capte les refus pour cause d'IP bloquée, d'où qu'ils viennent, pour
 * alimenter un décompte affiché globalement.
 */
@Injectable()
export class IpBlockInterceptor implements HttpInterceptor {
  private readonly blocage = inject(IpBlockService);

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse && error.status === 429) {
          const corps = error.error as IpBlockedError | null;

          if (corps?.code === 'IP_BLOCKED') {
            this.blocage.declare(corps);
          }
        }

        return throwError(() => error);
      })
    );
  }
}
