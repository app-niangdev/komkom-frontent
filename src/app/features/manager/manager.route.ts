import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { VexRoutes } from '@vex/interfaces/vex-route.interface';
import { UserService } from 'src/app/auth/services/user.service';
import { UserResponse } from 'src/app/interfaces/User';

export const UserResolver: ResolveFn<UserResponse> = () => {
  return inject(UserService).getUsers();
};

export const managerRoute: VexRoutes = [
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
    path: 'supplier',
    loadComponent: () =>
      import('../manager/supplier/supplier-list/supplier-list.component').then(
        (c) => c.SupplierListComponent
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
    path: 'procurement/add',
    loadComponent: () =>
      import(
        '../manager/procurement/procurement-add/procurement-add.component'
      ).then((c) => c.ProcurementAddComponent)
  },
  {
    path: 'procurement/list',
    loadComponent: () =>
      import(
        '../manager/procurement/procurement-list/procurement-list.component'
      ).then((c) => c.ProcurementListComponent)
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
    path: 'procurement/details',
    loadComponent: () =>
      import(
        '../manager/procurement/procurement-details/procurement-details.component'
      ).then((c) => c.ProcurementDetailsComponent)
  },
  {
    path: 'invoice',
    loadComponent: () =>
      import('../manager/invoice/invoice-list/invoice-list.component').then(
        (c) => c.InvoiceListComponent
      )
  },
  {
    path: 'payment',
    loadComponent: () =>
      import('../manager/payment/payment-list/payment-list.component').then(
        (c) => c.PaymentListComponent
      )
  },
  {
    path: 'invoice/details',
    loadComponent: () =>
      import(
        '../manager/invoice/invoice-details/invoice-details.component'
      ).then((c) => c.InvoiceDetailsComponent)
  },
  {
    path: 'expense',
    loadComponent: () =>
      import('../manager/expense/expense-list/expense-list.component').then(
        (c) => c.ExpenseListComponent
      )
  },
  {
    path: 'users',
    loadComponent: () =>
      import(
        '../owner/company-user/company-user-list/company-user-list.component'
      ).then((c) => c.CompanyUserListComponent),
    resolve: { userData: UserResolver }
  },
  {
    path: 'emei',
    loadComponent: () =>
      import('../manager/emei/emei-list/emei-list.component').then(
        (c) => c.EmeiListComponent
      )
  },
  {
    path: 'procurement-by-scanner',
    loadComponent: () =>
      import('../manager/procurement/procurement-by-scanner/procurement-by-scanner.component').then(
        (c) => c.ProcurementByScannerComponent
      )
  }
];
export default managerRoute;
