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
import { AuthService } from 'src/app/auth/services/auth.service';
import { EmeiService } from 'src/app/auth/services/imei.service';
import { StoreHeaderComponent } from 'src/app/features/store-header/store-header.component';
import { Company } from 'src/app/interfaces/Company';
import {
  FormatSerialNumber,
  SerialNumber,
  SerialNumberResponse
} from 'src/app/interfaces/SerialNumber';
import { Store } from 'src/app/interfaces/Store';
import {
  initialPaginationMeta,
  PaginationMeta
} from 'src/app/response-type/Type';
import Swal from 'sweetalert2';
import { Location } from '@angular/common';
import { EmeiUpdateComponent } from '../emei-update/emei-update.component';

@Component({
  selector: 'vex-emei-list',
  templateUrl: './emei-list.component.html',
  styleUrls: ['./emei-list.component.scss'],
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
export class EmeiListComponent implements OnInit {
  layoutCtrl = new UntypedFormControl('boxed');
  searchCtrl = new UntypedFormControl();

  serialNumbers: FormatSerialNumber[] = [];
  dataSource!: MatTableDataSource<FormatSerialNumber>;
  selection = new SelectionModel<FormatSerialNumber>(true, []);
  nbEmeis = 0;
  meta: PaginationMeta = { ...initialPaginationMeta };
  store!: Store;
  company: Company | null = null;
  isLoading = true;

  @Input() columns: TableColumn<SerialNumber>[] = [
    {
      label: 'Produit',
      property: 'product_name',
      type: 'text',
      visible: true,
      cssClasses: ['font-medium']
    },
    {
      label: 'Date',
      property: 'created_at',
      type: 'text',
      visible: true
    },
    {
      label: 'EMEI',
      property: 'serial_number',
      type: 'text',
      visible: true
    },
    {
      label: 'Fournisseur',
      property: 'supplier_full_name',
      type: 'text',
      visible: true,
      cssClasses: ['text-secondary', 'font-medium']
    },
    {
      label: 'Statut',
      property: 'is_sold',
      type: 'text',
      visible: true
    },
    {
      label: 'Actions',
      property: 'actions',
      type: 'button',
      visible: true
    }
  ];

  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;

  constructor(
    public dialog: MatDialog,
    private emeiService: EmeiService,
    private authService: AuthService,
    private location: Location
  ) {}

  // Définir les colonnes visibles
  get visibleColumns(): string[] {
    const columns = this.columns
      .filter((col) => col.visible)
      .map((col) =>
        col.property === 'product_name' ||
        col.property === 'product_description'
          ? 'product_details'
          : col.property
      );

    // Ajouter 'product_details' si nécessaire
    if (
      !columns.includes('product_details') &&
      (this.columns.some((c) => c.property === 'product_name' && c.visible) ||
        this.columns.some(
          (c) => c.property === 'product_description' && c.visible
        ))
    ) {
      const productNameIndex = columns.indexOf('product_name');
      const productDescIndex = columns.indexOf('product_description');

      if (productNameIndex !== -1) columns.splice(productNameIndex, 1);
      if (productDescIndex !== -1) columns.splice(productDescIndex, 1);

      columns.unshift('product_details');
    }

    return columns;
  }

  getProductDetailsColumn(): boolean {
    return this.columns.some(
      (c) =>
        (c.property === 'product_name' ||
          c.property === 'product_description') &&
        c.visible
    );
  }

  // Méthode pour obtenir les classes CSS du statut
  getStatusClass(status: boolean): string {
    switch (status) {
      case false:
        return 'inline-flex items-center rounded-md bg-green-600 px-2 py-1 text-base font-bold text-white';
      case true:
        return 'inline-flex items-center rounded-md bg-gray-500 px-2 py-1 text-base font-bold text-white animate-pulse';
      default:
        return 'inline-flex items-center rounded-md bg-gray-500 px-2 py-1 text-base font-bold text-white';
    }
  }

  // Méthode pour obtenir le libellé du statut
  getStatusLabel(status: boolean): string {
    switch (status) {
      case true:
        return 'Déja vendu';
      case false:
        return 'En stock';
      default:
        return status;
    }
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
    this.isLoading = false;
  }

  /** Lance la recherche à partir du bouton "Rechercher" (retour à la 1ère page). */
  search(): void {
    this.meta.current_page = 1;
    this.refreshData();
  }

  /** Réinitialise la recherche et recharge la liste. */
  resetSearch(): void {
    this.searchCtrl.setValue('');
    this.meta.current_page = 1;
    this.refreshData();
  }

  private fetchSerialNumbers(
    search = (this.searchCtrl.value || '').trim(),
    page = this.meta.current_page,
    perPage = this.meta.per_page
  ) {
    return this.emeiService.list(
      this.store.id,
      undefined,
      search,
      page,
      perPage
    );
  }

  assignData(data: SerialNumberResponse) {
    this.serialNumbers = data.data;
    this.meta = data.meta;
    this.nbEmeis = this.meta.total;
    this.dataSource = new MatTableDataSource<FormatSerialNumber>(
      this.serialNumbers
    );
  }

  refreshData() {
    this.fetchSerialNumbers().subscribe((response) =>
      this.assignData(response)
    );
  }

  pageEvent(page: PageEvent) {
    this.meta.per_page = page.pageSize;
    this.meta.current_page = page.pageIndex + 1;
    this.fetchSerialNumbers().subscribe((response) =>
      this.assignData(response)
    );
  }

  toggleColumnVisibility(column: TableColumn<SerialNumber>, event: Event) {
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

  update(serialNumber: SerialNumber): void {
    const dialogRef = this.dialog.open(EmeiUpdateComponent, {
      width: '480px',
      maxWidth: '95vw',
      panelClass: 'rounded-xl', // optionnel : coins arrondis via votre CSS global
      disableClose: false,
      data: { serialNumber, store: this.store }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.refreshData();
      }
    });
  }

  delete(element: SerialNumber) {
    Swal.fire({
      title: 'Confirmation',
      text: `Voulez-vous vraiment supprimer ce client "${element.serial_number}" ?`,
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

      this.emeiService.delete(element.id).subscribe({
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
