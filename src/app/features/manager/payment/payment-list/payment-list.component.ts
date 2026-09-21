import { CommonModule, Location, NgClass, NgFor, NgIf } from '@angular/common';
import { Component, Input, LOCALE_ID, OnInit, ViewChild } from '@angular/core';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  UntypedFormControl
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { stagger80ms } from '@vex/animations/stagger.animation';
import { VexPageLayoutContentDirective } from '@vex/components/vex-page-layout/vex-page-layout-content.directive';
import { VexPageLayoutComponent } from '@vex/components/vex-page-layout/vex-page-layout.component';
import { TableColumn } from '@vex/interfaces/table-column.interface';
import Swal from 'sweetalert2';
import { AuthService } from 'src/app/auth/services/auth.service';
import { PaymentService } from 'src/app/auth/services/payment.service';
import { StoreHeaderComponent } from 'src/app/features/store-header/store-header.component';
import { Company } from 'src/app/interfaces/Company';
import {
  PaymentListFilters,
  PaymentListItem,
  ResponsePaymentList
} from 'src/app/interfaces/PaymentList';
import { Store } from 'src/app/interfaces/Store';
import { IntegerSeparatorPipe } from 'src/app/pipes/integer-separator.pipe';
import { initialPaginationMeta, PaginationMeta } from 'src/app/response-type/Type';

/** Mode de filtre sur les dates : intervalle ou date précise. */
type DateMode = 'range' | 'single';

@Component({
  selector: 'vex-payment-list',
  templateUrl: './payment-list.component.html',
  styleUrls: ['./payment-list.component.scss'],
  animations: [stagger80ms, fadeInUp400ms],
  standalone: true,
  providers: [{ provide: LOCALE_ID, useValue: 'fr' }],
  imports: [
    CommonModule,
    NgIf,
    NgFor,
    NgClass,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatOptionModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    VexPageLayoutComponent,
    VexPageLayoutContentDirective,
    StoreHeaderComponent,
    IntegerSeparatorPipe
  ]
})
export class PaymentListComponent implements OnInit {
  payments: PaymentListItem[] = [];
  store!: Store;
  company!: Company;
  isLoading = true;
  isExporting = false;
  totalAmount = 0;

  dataSource = new MatTableDataSource<PaymentListItem>([]);
  meta: PaginationMeta = { ...initialPaginationMeta };

  searchCtrl = new UntypedFormControl();
  layoutCtrl = new UntypedFormControl('boxed');

  dateMode: DateMode = 'range';
  startDateControl = new FormControl<Date | null>(null);
  endDateControl = new FormControl<Date | null>(null);
  singleDateControl = new FormControl<Date | null>(null);
  selectedPaymentType = '';

  @ViewChild(MatSort) sort?: MatSort;

  @Input()
  columns: TableColumn<PaymentListItem>[] = [
    { label: 'Date', property: 'date', type: 'text', visible: true, cssClasses: ['font-medium'] },
    { label: 'Facture', property: 'invoice', type: 'text', visible: true },
    { label: 'Client', property: 'customer', type: 'text', visible: true },
    { label: 'Type', property: 'payment_type', type: 'text', visible: true },
    { label: 'Encaissé par', property: 'user', type: 'text', visible: true },
    { label: 'Montant', property: 'amount', type: 'text', visible: true }
  ];

  constructor(
    private paymentService: PaymentService,
    private authService: AuthService,
    private location: Location
  ) {}

  ngOnInit(): void {
    // Même résolution du store que les autres listes : un Owner arrive avec le store dans history.state.
    this.authService.getUserAuth().subscribe({
      next: (response) => {
        const roleName = response.user?.role?.name?.toLowerCase();

        if (roleName === 'owner') {
          if (history.state.store && history.state.company) {
            this.store = history.state.store;
            this.company = history.state.company;
            this.loadPayments();
          } else {
            this.goBack();
          }
        } else {
          this.store = response.store;
          if (response.company) this.company = response.company;
          this.loadPayments();
        }
      },
      error: (err) => {
        console.error("Erreur lors de la récupération de l'utilisateur", err);
        this.isLoading = false;
      }
    });
  }

  search(): void {
    this.meta.current_page = 1;
    this.loadPayments();
  }

  resetSearch(): void {
    this.searchCtrl.setValue('');
    this.startDateControl.setValue(null);
    this.endDateControl.setValue(null);
    this.singleDateControl.setValue(null);
    this.selectedPaymentType = '';
    this.meta.current_page = 1;
    this.loadPayments();
  }

  onDateModeChange(mode: DateMode): void {
    this.dateMode = mode;
    // On repart d'une base propre pour ne pas envoyer des filtres de l'autre mode.
    this.startDateControl.setValue(null);
    this.endDateControl.setValue(null);
    this.singleDateControl.setValue(null);
    this.meta.current_page = 1;
    this.loadPayments();
  }

  onSelectPaymentType(event: MatSelectChange): void {
    this.selectedPaymentType = event.value === 'all' ? '' : event.value;
    this.meta.current_page = 1;
    this.loadPayments();
  }

  pageEvent(page: PageEvent): void {
    this.meta.per_page = page.pageSize;
    this.meta.current_page = page.pageIndex + 1;
    this.loadPayments();
  }

  exportPdf(): void {
    this.isExporting = true;

    Swal.fire({
      title: 'Génération du PDF...',
      text: 'Veuillez patienter',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.paymentService.exportPdf(this.store.id, this.buildFilters()).subscribe({
      next: (blob) => {
        this.isExporting = false;
        Swal.close();
        this.saveBlob(blob, `paiements-${this.formatDate(new Date())}.pdf`);
      },
      error: () => {
        this.isExporting = false;
        Swal.close();
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Une erreur est survenue lors de la génération du PDF.',
          confirmButtonColor: '#d33'
        });
      }
    });
  }

  get visibleColumns(): string[] {
    return this.columns.filter((column) => column.visible).map((column) => column.property);
  }

  toggleColumnVisibility(column: TableColumn<PaymentListItem>, event: Event): void {
    event.stopPropagation();
    event.stopImmediatePropagation();
    column.visible = !column.visible;
  }

  getPaymentTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      cash: 'Espèces',
      wave: 'Wave',
      OM: 'Orange Money',
      other: 'Autre'
    };
    return labels[type] ?? type;
  }

  goBack(): void {
    this.location.back();
  }

  private loadPayments(): void {
    this.isLoading = true;

    this.paymentService
      .list(this.store.id, this.buildFilters(), this.meta.current_page, this.meta.per_page)
      .subscribe({
        next: (response) => this.assignData(response),
        error: (err) => {
          this.isLoading = false;
          console.error('Erreur lors de la récupération des paiements', err);
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Impossible de charger la liste des paiements.',
            confirmButtonColor: '#d33'
          });
        }
      });
  }

  private assignData(response: ResponsePaymentList): void {
    this.payments = response.data ?? [];
    this.totalAmount = response.totalAmount ?? 0;
    // Le backend ne renvoie pas pageSizeOptions : on conserve celui du front.
    this.meta = { ...this.meta, ...response.meta };
    this.dataSource = new MatTableDataSource<PaymentListItem>(this.payments);
    this.isLoading = false;
  }

  /** Construit les filtres envoyés à l'API — la date précise l'emporte sur l'intervalle. */
  private buildFilters(): PaymentListFilters {
    const filters: PaymentListFilters = {};

    const search = (this.searchCtrl.value || '').trim();
    if (search) filters.search = search;
    if (this.selectedPaymentType) filters.payment_type = this.selectedPaymentType;

    if (this.dateMode === 'single') {
      const date = this.singleDateControl.value;
      if (date) filters.date = this.formatDate(date);
    } else {
      const start = this.startDateControl.value;
      const end = this.endDateControl.value;
      if (start) filters.start_date = this.formatDate(start);
      if (end) filters.end_date = this.formatDate(end);
    }

    return filters;
  }

  /** Format YYYY-MM-DD attendu par l'API (sans décalage de fuseau, contrairement à toISOString). */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private saveBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
