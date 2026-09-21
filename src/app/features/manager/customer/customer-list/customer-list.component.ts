import { SelectionModel } from '@angular/cdk/collections';
import { NgIf, NgFor, NgClass, CommonModule } from '@angular/common';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import {
  ReactiveFormsModule,
  FormsModule,
  UntypedFormControl
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent
} from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { fadeInRight400ms } from '@vex/animations/fade-in-right.animation';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { scaleIn400ms } from '@vex/animations/scale-in.animation';
import { stagger80ms } from '@vex/animations/stagger.animation';
import { VexPageLayoutContentDirective } from '@vex/components/vex-page-layout/vex-page-layout-content.directive';
import { VexPageLayoutComponent } from '@vex/components/vex-page-layout/vex-page-layout.component';
import { TableColumn } from '@vex/interfaces/table-column.interface';
import {
  debounceTime,
  distinctUntilChanged,
  Observable,
  ReplaySubject,
  switchMap
} from 'rxjs';
import { AuthService } from 'src/app/auth/services/auth.service';
import { Company } from 'src/app/interfaces/Company';
import { Customer, ResponseCustomer } from 'src/app/interfaces/Customer';
import { Store } from 'src/app/interfaces/Store';
import {
  PaginationMeta,
  initialPaginationMeta
} from 'src/app/response-type/Type';
import { CustomerAddUpdateComponent } from '../customer-add-update/customer-add-update.component';
import { CustomerService } from 'src/app/auth/services/customer.service';
import Swal from 'sweetalert2';
import { Location } from '@angular/common';
import { StoreHeaderComponent } from 'src/app/features/store-header/store-header.component';

@Component({
  selector: 'vex-customer-list',
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.scss'],
  animations: [stagger80ms, fadeInUp400ms, scaleIn400ms, fadeInRight400ms],
  standalone: true,
  imports: [
    VexPageLayoutComponent,
    MatButtonToggleModule,
    ReactiveFormsModule,
    VexPageLayoutContentDirective,
    NgIf,
    MatButtonModule,
    MatTooltipModule,
    MatIconModule,
    MatMenuModule,
    MatTableModule,
    MatSortModule,
    MatSelectModule,
    MatOptionModule,
    MatCheckboxModule,
    NgFor,
    NgClass,
    MatPaginatorModule,
    FormsModule,
    MatDialogModule,
    MatInputModule,
    MatSnackBarModule,
    CommonModule,
    MatSlideToggleModule,
    StoreHeaderComponent
  ]
})
export class CustomerListComponent implements OnInit {
  selectedRole: string | null = null;
  layoutCtrl = new UntypedFormControl('boxed');
  searchCtrl = new UntypedFormControl();

  customers: Customer[] = [];
  dataSource!: MatTableDataSource<Customer>;
  selection = new SelectionModel<Customer>(true, []);
  nbCustomers = 0;
  meta: PaginationMeta = { ...initialPaginationMeta };
  store!: Store;
  company: Company | null = null;
  isLoading = true;

  @Input() columns: TableColumn<Customer>[] = [
    { label: '#', property: 'icon', type: 'image', visible: true },
    {
      label: 'Prénom & Nom',
      property: 'name',
      type: 'text',
      visible: true,
      cssClasses: ['font-medium']
    },
    { label: 'Adresse', property: 'address', type: 'text', visible: true },
    { label: 'Téléphone', property: 'phone', type: 'text', visible: true },
    {
      label: 'Email',
      property: 'email',
      type: 'text',
      visible: true,
      cssClasses: ['text-secondary', 'font-medium']
    },
    { label: 'Actions', property: 'actions', type: 'button', visible: true }
  ];

  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;

  constructor(
    public dialog: MatDialog,
    private customerService: CustomerService,
    private authService: AuthService,
    private location: Location
  ) {}

  get visibleColumns() {
    return this.columns.filter((c) => c.visible).map((c) => c.property);
  }

  ngOnInit() {
    this.authService.getUserAuth().subscribe({
      next: (response) => {
        const role = response.user?.role?.name?.toLowerCase();
        if (role === 'manager' || role === 'seller') {
          this.store = response.store;
          this.company = response.company ?? null;
        } else {
          if (
            role === 'owner' &&
            (!history.state.store || !history.state.company)
          ) {
            return this.goBack();
          }
          this.store = history.state.store;
          this.company = history.state.company;
        }
        this.initComponent();
      },
      error: (err) => {
        console.error("Erreur lors de la récupération de l'utilisateur", err);
        this.isLoading = false;
      }
    });
  }

  private initComponent(): void {
    this.refreshData();
    this.searchCtrl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => this.fetchCustomers(term))
      )
      .subscribe((response) => this.assignData(response));
    this.isLoading = false;
  }

  private fetchCustomers(
    search = '',
    page = this.meta.current_page,
    perPage = this.meta.per_page
  ) {
    return this.customerService.list(this.store.id, search, page, perPage);
  }

  assignData(data: ResponseCustomer) {
    this.customers = data.data;
    this.meta = data.meta;
    this.nbCustomers = this.meta.total;
    this.dataSource = new MatTableDataSource<Customer>(this.customers);
  }

  refreshData() {
    this.fetchCustomers().subscribe((response) => this.assignData(response));
  }

  pageEvent(page: PageEvent) {
    this.meta.per_page = page.pageSize;
    this.meta.current_page = page.pageIndex + 1;
    this.fetchCustomers().subscribe((response) => this.assignData(response));
  }

  toggleColumnVisibility(column: TableColumn<Customer>, event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();
    column.visible = !column.visible;
  }

  isAllSelected() {
    return this.selection.selected.length === this.dataSource.data.length;
  }

  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach((row) => this.selection.select(row));
  }

  trackByProperty<T>(_: number, column: TableColumn<T>) {
    return column.property;
  }

  add() {
    this.openDialog({
      isEditMode: false,
      store: this.store,
      title: 'Ajouter un client'
    });
  }

  update(customer: Customer) {
    this.openDialog({ isEditMode: true, customer, store: this.store });
  }

  private openDialog(data: object) {
    this.dialog
      .open(CustomerAddUpdateComponent, {
        width: '700px',
        disableClose: true,
        data
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) this.refreshData();
      });
  }

  delete(element: Customer) {
    Swal.fire({
      title: 'Confirmation',
      text: `Voulez-vous vraiment supprimer ce client "${element.name}" ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      customClass: swalCustomClass
    }).then((result) => {
      if (!result.isConfirmed) return;

      Swal.fire({
        title: 'Suppression en cours...',
        text: 'Veuillez patienter',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      this.customerService.delete(element.id).subscribe({
        next: (res) =>
          Swal.fire({
            icon: 'success',
            title: 'Supprimé !',
            text: res.message || 'Le client a été supprimé avec succès.',
            timer: 2000,
            showConfirmButton: false
          }),
        error: (err) =>
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text:
              err?.error.message ||
              'Une erreur est survenue lors de la suppression.',
            confirmButtonColor: '#d33',
            customClass: swalCustomClass
          })
      });

      this.refreshData();
    });
  }

  goBack() {
    this.location.back();
  }
}

const swalCustomClass = {
  container: 'swal2-container-custom',
  popup: 'swal2-popup-custom',
  actions: 'swal2-actions-custom',
  confirmButton: 'swal2-confirm-custom',
  cancelButton: 'swal2-cancel-custom'
};
