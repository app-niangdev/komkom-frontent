import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { VexRoutes } from '@vex/interfaces/vex-route.interface';
import { CompanyService } from 'src/app/auth/services/company.service';
import { CompanyResponse } from 'src/app/interfaces/Company';
import { environment } from 'src/environments/environment';

export const CompanyResolver: ResolveFn<CompanyResponse> = () => {
  const page = environment.current_page;
  const perPage = environment.per_page;
  return inject(CompanyService).getCompanies('',page, perPage,'');
};

export const adminRoute: VexRoutes = [
  {
    path: 'company/list',
    loadComponent: () =>
      import('../admin/company/company-list/company-list.component').then(
        (c) => c.CompanyListComponent
      ),
      resolve: {companies:CompanyResolver}
  },
  {
    path: 'company/add',
    loadComponent: () =>
      import('../admin/company/company-add/company-add.component').then(
        (c) => c.CompanyAddComponent
      )
  },
  {
    path: 'company/store',
    loadComponent: () =>
      import('../admin/company/company-store/company-store.component').then(
        (c) => c.CompanyStoreComponent
      )
  }
];
export default adminRoute;
