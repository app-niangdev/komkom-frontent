import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './auth-interceptor';
import { ServerErrorInterceptor } from './server-error.interceptor';
import { HttpsInterceptor } from './https-interceptor';
import { JwtRefreshInterceptor } from './jwt-refresh.interceptor';
import { IpBlockInterceptor } from './ip-block.interceptor';

export const httpInterceptorProviders = [
  // Déclaré avant le reste : un 429 pour IP bloquée doit être reconnu comme
  // tel avant que d'autres intercepteurs ne le traitent différemment.
  {
    provide: HTTP_INTERCEPTORS,
    useClass: IpBlockInterceptor,
    multi: true
  },
  {
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true
  },
  // { provide: HTTP_INTERCEPTORS, useClass: HttpsInterceptor, multi: true },
  {
    provide: HTTP_INTERCEPTORS,
    useClass: JwtRefreshInterceptor,
    multi: true
  },
  {
    provide: HTTP_INTERCEPTORS,
    useClass: ServerErrorInterceptor,
    multi: true
  }
];
