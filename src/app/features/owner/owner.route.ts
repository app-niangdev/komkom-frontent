import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { VexRoutes } from '@vex/interfaces/vex-route.interface';
import { UserService } from 'src/app/auth/services/user.service';
import { UserResponse } from 'src/app/interfaces/User';

export const UserResolver: ResolveFn<UserResponse> = () => {
  return inject(UserService).getUsers();
};

export const ownerRoute: VexRoutes = [
  {
    path: 'home',
    loadComponent: () =>
      import('../owner/company-stats/company-stats.component').then(
        (c) => c.CompanyStatsComponent
      )
  },
  {
    path: 'stores',
    loadComponent: () =>
      import('../owner/company-home/company-home.component').then(
        (c) => c.CompanyHomeComponent
      )
  },
  {
    path: 'my-company',
    loadComponent: () =>
      import('../owner/company-show-update/company-show-update.component').then(
        (c) => c.CompanyShowUpdateComponent
      )
  },
  {
    path: 'store',
    loadComponent: () =>
      import('../owner/owner-view-store/owner-view-store.component').then(
        (c) => c.OwnerViewStoreComponent
      )
  },
  {
    path: 'users',
    loadComponent: () =>
      import('../owner/company-user/company-user-list/company-user-list.component').then(
        (c) => c.CompanyUserListComponent
      ),
      resolve: {userData:UserResolver}
  }
];
export default ownerRoute;
