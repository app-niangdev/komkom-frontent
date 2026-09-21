import { AdminGuard } from './core/guards/admin.guard';
import { AfterLoginGuard } from './core/guards/after-login.guard';
import { AuthGuard } from './core/guards/auth.guard';
import { OwnerGuard } from './core/guards/owner.guard';
import { LayoutComponent } from './layouts/layout/layout.component';
import { VexRoutes } from '@vex/interfaces/vex-route.interface';

export const appRoutes: VexRoutes = [
  {
    path: '',
    loadChildren: () => import('./auth/auth-route'),
    canActivate: [AfterLoginGuard]
  },
  {
    path: 'index',
    component: LayoutComponent,
    canActivate :[AuthGuard],

    children: [
      {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.route'),
        canActivate: [AdminGuard]
      },
      {
        path: 'owner',
        loadChildren: () => import('./features/owner/owner.route'),
        canActivate: [OwnerGuard]
      },
      {
        path: 'manager',
        loadChildren: () => import('./features/manager/manager.route'),
      },
      {
            path: 'profile',
            loadChildren: () => import('./layouts/components/profile/profile.routes')
      },
      // {
      //   path: 'profile',
      //   loadComponent: () =>
      //         import('./layouts/components/profile/profile.component').then((c) => c.ProfileComponent),
      // },
    ]
  }
];
