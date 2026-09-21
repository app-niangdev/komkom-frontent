import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { VexRoutes } from '@vex/interfaces/vex-route.interface';
import { UserService } from 'src/app/auth/services/user.service';
import { UserResponse } from 'src/app/interfaces/User';

export const UserResolver: ResolveFn<UserResponse> = () => {
  return inject(UserService).getUsers();
};

export const sellerRoute: VexRoutes = [
  {
    path: 'home',
    loadComponent: () =>
      import('../owner/company-stats/company-stats.component').then(
        (c) => c.CompanyStatsComponent
      )
  },
  {
    path: 'customer',
    loadComponent: () =>
      import('../manager/customer/customer-list/customer-list.component').then(
        (c) => c.CustomerListComponent
      )
  },
  {
    path: 'category',
    loadComponent: () =>
      import('../manager/category/category-list/category-list.component').then(
        (c) => c.CategoryListComponent
      )
  },
  {
    path: 'product',
    loadComponent: () =>
      import('../manager/product/product-list/product-list.component').then(
        (c) => c.ProductListComponent
      )
  },
  {
    path: 'sale/list',
    loadComponent: () =>
      import('../manager/sale/sale-list/sale-list.component').then(
        (c) => c.SaleListComponent
      )
  },
  {
    path: 'sale/add',
    loadComponent: () =>
      import('../manager/sale/sale-add/sale-add.component').then(
        (c) => c.SaleAddComponent
      )
  },
  {
    path: 'sale/update',
    loadComponent: () =>
      import('../manager/sale/sale-update/sale-update.component').then(
        (c) => c.SaleUpdateComponent
      )
  },
  {
    path: 'sale/details',
    loadComponent: () =>
      import('../manager/sale/sale-details/sale-details.component').then(
        (c) => c.SaleDetailsComponent
      )
  },
  {
    path: 'invoice',
    loadComponent: () =>
      import('../manager/invoice/invoice-list/invoice-list.component').then(
        (c) => c.InvoiceListComponent
      )
  },
  {
    path: 'expense',
    loadComponent: () =>
      import('../manager/expense/expense-list/expense-list.component').then(
        (c) => c.ExpenseListComponent
      )
  }
];
export default sellerRoute;
