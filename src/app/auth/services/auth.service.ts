import { inject, Injectable } from '@angular/core';

import {
  BehaviorSubject,
  Observable,
  tap,
  map,
  catchError,
  throwError,
  of,
  shareReplay,
  finalize
} from 'rxjs';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangePassword } from 'src/app/interfaces/ChangePassword';
import { User } from 'src/app/interfaces/User';
import {
  CurrentUserAuth,
  AuthResponse,
  ResponseMessage
} from 'src/app/response-type/Type';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private user$ = new BehaviorSubject<CurrentUserAuth | null>(null);
  private currentUser$ = new BehaviorSubject<User | null>(null);
  private currentUserAuth$ = new BehaviorSubject<CurrentUserAuth | null>(null);
  private companySubject$ = new BehaviorSubject<{
    short_name: string;
    logo_url: string;
  } | null>(null);
  private http = inject(HttpClient);
  private router = inject(Router);

  private authCheck$?: Observable<boolean>;
  private authCheckComplete = false;

  login(credentials: {
    email: string;
    password: string;
  }): Observable<AuthResponse> {
    this.invalidateAuthCheck();
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        // OTP_REQUIRED : aucune session n'existe encore, seul un challenge
        // de vérification a été ouvert. Charger l'utilisateur ici échouerait.
        if (response.status === true && response.code !== 'OTP_REQUIRED') {
          this.loadUser().subscribe();
        }
      })
    );
  }

  verifyLoginOtp(data: {
    challenge_token: string;
    code: string;
    remember_me?: boolean;
  }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login/verify-otp`, data)
      .pipe(
        tap((response) => {
          if (response.status === true) {
            this.loadUser().subscribe();
          }
        })
      );
  }

  resendLoginOtp(challengeToken: string): Observable<ResponseMessage> {
    return this.http.post<ResponseMessage>(`${this.apiUrl}/login/resend-otp`, {
      challenge_token: challengeToken
    });
  }

  /**
   * Vérifie la session côté serveur (routes protégées uniquement).
   * Ne pas appeler sur les pages publiques (login) : /authenticate exige un cookie valide.
   */
  checkAuthStatus(): Observable<boolean> {
    if (this.authCheck$) {
      return this.authCheck$;
    }

    this.authCheck$ = this.fetchCurrentUser().pipe(
      tap((response) => this.applyAuthenticatedUser(response)),
      map(() => true),
      catchError(() => {
        this.clearAuthState();
        return of(false);
      }),
      finalize(() => {
        this.authCheckComplete = true;
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    return this.authCheck$;
  }

  hasAuthCheckCompleted(): boolean {
    return this.authCheckComplete;
  }

  isLoggedIn(): boolean {
    return this.isAuthenticatedSubject.getValue();
  }

  changePassword(
    userId: number,
    data: ChangePassword
  ): Observable<ResponseMessage> {
    return this.http.put<ResponseMessage>(
      `${this.apiUrl}/change-password/${userId}`,
      data
    );
  }

  logout(): Observable<ResponseMessage> {
    return this.http.post<ResponseMessage>(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        this.clearAuthState();
        this.invalidateAuthCheck();
      }),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur est survenue';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }
    return throwError(() => new Error(errorMessage));
  }

  getUser(): Observable<CurrentUserAuth> {
    const cached = this.currentUserAuth$.getValue();
    if (cached) {
      return of(cached);
    }
    return this.fetchCurrentUser().pipe(
      tap((user) => {
        this.user$.next(user);
        this.currentUserAuth$.next(user);
      }),
      catchError((error) => {
        this.user$.next(null);
        return throwError(() => error);
      })
    );
  }

  private loadUser() {
    return this.fetchCurrentUser().pipe(
      tap((currentUserAuth) => {
        this.applyAuthenticatedUser(currentUserAuth);
        this.isAuthenticatedSubject.next(true);
        this.invalidateAuthCheck();
        switch (currentUserAuth.user.role.name) {
          case 'Admin':
            this.router.navigate(['/index/admin/company/list']);
            break;
          case 'Owner':
            this.router.navigate(['/index/owner/stores']);
            break;
          case 'manager':
          case 'seller':
            this.router.navigate(['/index/manager/home']);
            break;
          default:
            break;
        }
      }),
      catchError((error) => {
        this.clearAuthState();
        return throwError(() => error);
      })
    );
  }

  forgotPassword(email: string): Observable<ResponseMessage> {
    return this.http.post<ResponseMessage>(`${this.apiUrl}/forgot-password`, {
      email
    });
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUser$.asObservable();
  }

  resetPassword(data: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Observable<ResponseMessage> {
    return this.http.post<ResponseMessage>(
      `${this.apiUrl}/reset-password`,
      data
    );
  }

  getCurrentUserSync(): User | null {
    return this.currentUser$.getValue();
  }

  getUserAuth(): Observable<CurrentUserAuth> {
    const cached = this.currentUserAuth$.getValue();
    if (cached) {
      return of(cached);
    }
    return this.fetchCurrentUser().pipe(
      tap((userAuth) => this.applyAuthenticatedUser(userAuth))
    );
  }

  getCurrentUserAuth(): Observable<CurrentUserAuth | null> {
    return this.currentUserAuth$.asObservable();
  }

  refreshUserAuth(): Observable<CurrentUserAuth> {
    this.invalidateAuthCheck();
    return this.fetchCurrentUser().pipe(
      tap((userAuth) => this.applyAuthenticatedUser(userAuth))
    );
  }

  getCurrentCompany(): Observable<{
    short_name: string;
    logo_url: string;
  } | null> {
    return this.companySubject$.asObservable();
  }

  private fetchCurrentUser(): Observable<CurrentUserAuth> {
    return this.http.get<CurrentUserAuth>(`${this.apiUrl}/authenticate`);
  }

  private applyAuthenticatedUser(response: CurrentUserAuth): void {
    this.currentUser$.next(response.user);
    this.currentUserAuth$.next(response);
    this.user$.next(response);
    this.isAuthenticatedSubject.next(true);
    if (response.company) {
      this.companySubject$.next({
        short_name: response.company.short_name,
        logo_url: response.company.logo_url
      });
    }
  }

  private clearAuthState(): void {
    this.currentUser$.next(null);
    this.currentUserAuth$.next(null);
    this.user$.next(null);
    this.companySubject$.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  private invalidateAuthCheck(): void {
    this.authCheck$ = undefined;
    this.authCheckComplete = false;
  }
}
