import { SelectionModel } from '@angular/cdk/collections';
import {
  NgIf,
  NgFor,
  NgClass,
  CommonModule,
  registerLocaleData
} from '@angular/common';
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
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { fadeInRight400ms } from '@vex/animations/fade-in-right.animation';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { scaleIn400ms } from '@vex/animations/scale-in.animation';
import { stagger80ms } from '@vex/animations/stagger.animation';
import { VexPageLayoutContentDirective } from '@vex/components/vex-page-layout/vex-page-layout-content.directive';
import { VexPageLayoutComponent } from '@vex/components/vex-page-layout/vex-page-layout.component';
import { TableColumn } from '@vex/interfaces/table-column.interface';
import { Observable, ReplaySubject } from 'rxjs';
import { InvoiceService } from 'src/app/auth/services/invoice.service';
import { Company } from 'src/app/interfaces/Company';
import { Invoice, ResponseInvoice } from 'src/app/interfaces/Invoice';
import { Store } from 'src/app/interfaces/Store';
import { IntegerSeparatorPipe } from 'src/app/pipes/integer-separator.pipe';
import {
  initialPaginationMeta,
  PaginationMeta
} from 'src/app/response-type/Type';
import { PaiementInvoiceComponent } from '../paiement-invoice/paiement-invoice.component';
import { ReceiptModalComponent } from '../receipt-modal/receipt-modal.component';
import localeFr from '@angular/common/locales/fr';
import { AuthService } from 'src/app/auth/services/auth.service';
registerLocaleData(localeFr, 'fr');
import { Location } from '@angular/common';
import { StoreHeaderComponent } from 'src/app/features/store-header/store-header.component';
@Component({
  selector: 'vex-invoice-list',
  templateUrl: './invoice-list.component.html',
  styleUrls: ['./invoice-list.component.scss'],
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
    IntegerSeparatorPipe,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    StoreHeaderComponent
  ]
})
export class InvoiceListComponent implements OnInit {
  selectedRole: string | null = null;
  layoutCtrl = new UntypedFormControl('boxed');
  subject$: ReplaySubject<Invoice[]> = new ReplaySubject<Invoice[]>(1);
  data$: Observable<ResponseInvoice> = new Observable<ResponseInvoice>();
  invoices: Invoice[] = [];
  store!: Store;
  company!: Company;
  isLoading = true;

  dataSource!: MatTableDataSource<Invoice>;
  selection = new SelectionModel<Invoice>(true, []);
  searchCtrl = new UntypedFormControl();
  /** Statut actif sélectionné dans le filtre ('' = tous). */
  selectedStatus = '';

  meta: PaginationMeta = { ...initialPaginationMeta };

  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;

  @Input()
  columns: TableColumn<Invoice>[] = [
    {
      label: 'Num Facture',
      property: 'invoice_number',
      type: 'text',
      visible: true,
      cssClasses: ['font-medium']
    },
    {
      label: 'Client',
      property: 'customer',
      type: 'text',
      visible: true
    },
    {
      label: 'Date Facture',
      property: 'date',
      type: 'text',
      visible: true
    },
    {
      label: 'Montant Total',
      property: 'amount_total',
      type: 'text',
      visible: true
    },
    {
      label: 'Statut',
      property: 'invoice_status',
      type: 'text',
      visible: true
    },
    {
      label: 'Balance',
      property: 'balance',
      type: 'text',
      visible: true
    },
    {
      label: 'Montant Payé',
      property: 'amount_paid',
      type: 'text',
      visible: true
    },
    { label: 'Actions', property: 'actions', type: 'button', visible: true }
  ];

  constructor(
    public dialog: MatDialog,
    private invoiceService: InvoiceService,
    private router: Router,
    private authService: AuthService,
    private location: Location
  ) {}

  ngOnInit() {
    this.authService.getUserAuth().subscribe({
      next: (response) => {
        const roleName = response.user?.role?.name?.toLowerCase();

        if (roleName === 'owner') {
          // Owner : récupérer le store depuis le state de navigation
          if (history.state.store && history.state.company) {
            this.store = history.state.store;
            this.company = history.state.company;
            this.initComponent();
          } else {
            this.goBack();
          }
        } else {
          // Manager ou Seller : le store vient de l'API
          this.store = response.store;
          if (response.company) {
            this.company = response.company;
          }
          this.initComponent();
        }
      },
      error: (err) => {
        console.error("Erreur lors de la récupération de l'utilisateur", err);
        this.isLoading = false;
      }
    });
  }

  private initComponent(): void {
    this.loadInvoices();
    this.isLoading = false;
  }

  /** Lance la recherche via le bouton "Rechercher" (retour à la 1ère page). */
  search(): void {
    this.meta.current_page = 1;
    this.loadInvoices();
  }

  /** Réinitialise la recherche et le filtre de statut. */
  resetSearch(): void {
    this.searchCtrl.setValue('');
    this.selectedStatus = '';
    this.meta.current_page = 1;
    this.loadInvoices();
  }

  /** Recharge la liste en tenant compte de la recherche, du statut et de la pagination. */
  private loadInvoices(): void {
    const searchTerm = (this.searchCtrl.value || '').trim();
    this.invoiceService
      .list(
        this.store.id,
        searchTerm,
        this.selectedStatus,
        this.meta.current_page,
        this.meta.per_page
      )
      .subscribe({
        next: (response) => {
          this.assignData(response);
        }
      });
  }

  onSelectStatus(event: MatSelectChange) {
    // 'all' correspond à « aucun filtre de statut »
    this.selectedStatus = event.value === 'all' ? '' : event.value;
    this.meta.current_page = 1;
    this.loadInvoices();
  }

  get visibleColumns() {
    return this.columns
      .filter((column) => column.visible)
      .map((column) => column.property);
  }

  assignData(data: ResponseInvoice) {
    this.invoices = data.data;
    this.meta = data.meta;
    this.dataSource = new MatTableDataSource<Invoice>(this.invoices);
  }

  toggleColumnVisibility(column: TableColumn<Invoice>, event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();
    column.visible = !column.visible;
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'paid':
        return 'Payées';
      case 'partial':
        return 'Partiellement payées';
      case 'no_paid':
        return 'Non payées';
      case 'cancelled':
        return 'Annulée';
      default:
        return 'Inconnu';
    }
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach((row) => this.selection.select(row));
  }

  trackByProperty<T>(index: number, column: TableColumn<T>) {
    return column.property;
  }

  public refreshData(_searchTerm: string = '') {
    this.loadInvoices();
  }

  payInvoice(row?: Invoice) {
    const invoice =
      row ||
      (this.selection.selected.length === 1
        ? this.selection.selected[0]
        : null);

    if (!invoice) {
      return;
    }

    if (invoice.invoice_status === 'paid') {
      return;
    }

    const dialogRef = this.dialog.open(PaiementInvoiceComponent, {
      width: '500px',
      disableClose: true,
      data: { invoice }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.refreshData('');
      }
    });
  }

  goToDetail(invoice: Invoice) {
    this.router.navigate(['index/manager/invoice/details'], {
      state: { invoice: invoice }
    });
  }

  download(invoice: Invoice): void {
    if (!invoice.id) {
      console.error('ID de facture non défini');
      return;
    }

    // Ouvrir le modal de reçu de caisse
    this.dialog.open(ReceiptModalComponent, {
      data: { invoice: invoice, store: this.store },
      width: '100%',
      maxWidth: '400px',
      panelClass: 'receipt-modal-dialog'
    });
  }

  pageEvent(page: PageEvent) {
    this.meta.per_page = page.pageSize;
    this.meta.current_page = page.pageIndex + 1;
    this.loadInvoices();
  }

  goBack() {
    this.location.back();
  }
}
