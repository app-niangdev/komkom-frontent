import { NgIf, NgFor, NgClass, CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
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
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { fadeInRight400ms } from '@vex/animations/fade-in-right.animation';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { scaleIn400ms } from '@vex/animations/scale-in.animation';
import { stagger80ms } from '@vex/animations/stagger.animation';
import { VexPageLayoutContentDirective } from '@vex/components/vex-page-layout/vex-page-layout-content.directive';
import { VexPageLayoutComponent } from '@vex/components/vex-page-layout/vex-page-layout.component';
import { TableColumn } from '@vex/interfaces/table-column.interface';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { AuthService } from 'src/app/auth/services/auth.service';
import { SupplierService } from 'src/app/auth/services/supplier.service';
import { Company } from 'src/app/interfaces/Company';
import { Store } from 'src/app/interfaces/Store';
import { Supplier, SupplierResponse } from 'src/app/interfaces/Supplier';
import {
  initialPaginationMeta,
  PaginationMeta
} from 'src/app/response-type/Type';
import { SupplierAddUpdateComponent } from '../supplier-add-update/supplier-add-update.component';
import Swal from 'sweetalert2';
import { Location } from '@angular/common';
import { StoreHeaderComponent } from 'src/app/features/store-header/store-header.component';
@Component({
  selector: 'vex-supplier-list',
  templateUrl: './supplier-list.component.html',
  styleUrls: ['./supplier-list.component.scss'],
  standalone: true,
  animations: [stagger80ms, fadeInUp400ms, scaleIn400ms, fadeInRight400ms],
  imports: [
    VexPageLayoutComponent,
    MatButtonToggleModule,
    ReactiveFormsModule,
    VexPageLayoutContentDirective,
    NgIf,
    MatButtonModule,
    MatTooltipModule,
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
    MatIconModule,
    StoreHeaderComponent
  ]
})
export class SupplierListComponent implements OnInit {
  store!: Store;
  company: Company | null = null;
  searchCtrl = new UntypedFormControl();
  layoutCtrl = new UntypedFormControl('boxed');
  suppliers: Supplier[] = [];
  meta: PaginationMeta = { ...initialPaginationMeta };
  dataSource!: MatTableDataSource<Supplier>;

  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;

  @Input() columns: TableColumn<Supplier>[] = [
    { label: '#', property: 'icon', type: 'image', visible: true },
    {
      label: 'Prénom & Nom',
      property: 'name',
      type: 'text',
      visible: true,
      cssClasses: ['font-medium']
    },
    {
      label: 'Email',
      property: 'email',
      type: 'text',
      visible: true,
      cssClasses: ['text-secondary', 'font-medium']
    },
    {
      label: 'Téléphone 1',
      property: 'phone_one',
      type: 'text',
      visible: true
    },
    {
      label: 'Téléphone 2',
      property: 'phone_two',
      type: 'text',
      visible: true
    },
    { label: 'Adresse', property: 'address', type: 'text', visible: true },
    { label: 'Actions', property: 'actions', type: 'button', visible: true }
  ];

  constructor(
    private authService: AuthService,
    public dialog: MatDialog,
    private supplierService: SupplierService,
    private cd: ChangeDetectorRef,
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
        this.loadSuppliers();
        this.initSearch();
      },
      error: (err) =>
        console.error("Erreur lors de la récupération de l'utilisateur", err)
    });
  }

  private initSearch(): void {
    this.searchCtrl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => this.fetchSuppliers(term))
      )
      .subscribe((response) => this.assignData(response));
  }

  private fetchSuppliers(
    search = '',
    page = this.meta.current_page,
    perPage = this.meta.per_page
  ) {
    return this.supplierService.getSupplier(
      this.store.id,
      search,
      page,
      perPage
    );
  }

  assignData(data: SupplierResponse) {
    this.suppliers = data.data;
    this.meta = data.meta;
    this.dataSource = new MatTableDataSource<Supplier>(this.suppliers);
  }

  loadSuppliers() {
    this.fetchSuppliers().subscribe((response) => this.assignData(response));
  }

  pageEvent(page: PageEvent) {
    this.meta.per_page = page.pageSize;
    this.meta.current_page = page.pageIndex + 1;
    this.fetchSuppliers().subscribe((response) => this.assignData(response));
  }

  toggleColumnVisibility(column: TableColumn<Supplier>, event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();
    column.visible = !column.visible;
  }

  add() {
    this.openDialog({ isEditMode: false, store: this.store }, '900px');
  }

  update(supplier: Supplier) {
    this.openDialog(
      { isEditMode: true, supplier, store: this.store },
      '1000px'
    );
  }

  private openDialog(data: object, width: string) {
    this.dialog
      .open(SupplierAddUpdateComponent, { width, disableClose: true, data })
      .afterClosed()
      .subscribe((result) => {
        if (result) this.loadSuppliers();
      });
  }

  delete(supplier: Supplier) {
    this.cd.detectChanges();
    Swal.fire({
      title: 'Confirmation',
      text: `Voulez-vous vraiment supprimer ce fournisseur "${supplier.name}" ?`,
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

      this.supplierService.delete(supplier.id).subscribe({
        next: (res) => {
          Swal.fire({
            icon: 'success',
            title: 'Supprimé !',
            text: res.message || 'Le fournisseur a été supprimé avec succès.',
            timer: 2000,
            showConfirmButton: false
          });
          this.loadSuppliers();
        },
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
