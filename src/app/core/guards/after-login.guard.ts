import { inject, Injectable } from '@angular/core';
import { CanActivate, UrlTree, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from 'src/app/auth/services/auth.service';

/**
 * Pages publiques (login, forgot-password, etc.).
 * Ne pas appeler /authenticate ici : la route API exige Sanctum et renvoie 401
 * sans session. La vérification serveur se fait via AuthGuard sur /index.
 */
@Injectable({
  providedIn: 'root'
})
export class AfterLoginGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(): Observable<boolean | UrlTree> {
    if (!this.authService.isLoggedIn()) {
      return of(true);
    }

    const user = this.authService.getCurrentUserSync();
    if (!user) {
      return of(true);
    }

    const roleName = user.role?.name?.toLowerCase();
    if (roleName === 'owner') {
      return of(this.router.createUrlTree(['/index/owner/stores']));
    }
    if (roleName === 'manager' || roleName === 'seller') {
      return of(this.router.createUrlTree(['/index/manager/home']));
    }
    return of(this.router.createUrlTree(['/index/admin/company/list']));
  }
}
