import {
  NgIf,
  NgFor,
  NgClass,
  CommonModule,
  DatePipe,
  registerLocaleData
} from '@angular/common';
import { Component, Input, LOCALE_ID, OnInit, ViewChild } from '@angular/core';
import {
  ReactiveFormsModule,
  FormsModule,
  UntypedFormControl
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
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
import { Router } from '@angular/router';
import { fadeInRight400ms } from '@vex/animations/fade-in-right.animation';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { scaleIn400ms } from '@vex/animations/scale-in.animation';
import { stagger80ms } from '@vex/animations/stagger.animation';
import localeFr from '@angular/common/locales/fr';
import { VexPageLayoutContentDirective } from '@vex/components/vex-page-layout/vex-page-layout-content.directive';
import { VexPageLayoutComponent } from '@vex/components/vex-page-layout/vex-page-layout.component';
import { IntegerSeparatorPipe } from 'src/app/pipes/integer-separator.pipe';
import { SaleService } from 'src/app/auth/services/sale.service';
import { Store } from 'src/app/interfaces/Store';
import {
  CurrentUserAuth,
  initialPaginationMeta,
  PaginationMeta
} from 'src/app/response-type/Type';
import { TableColumn } from '@vex/interfaces/table-column.interface';
import Swal from 'sweetalert2';
import { Sale } from 'src/app/interfaces/Sale';
import { NotificationService } from 'src/app/auth/services/Notification.service';
import { Company } from 'src/app/interfaces/Company';
import { AuthService } from 'src/app/auth/services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { SaleReceiptModalComponent } from '../sale-receipt-modal/sale-receipt-modal.component';
registerLocaleData(localeFr, 'fr');
import { Location } from '@angular/common';
import { StoreHeaderComponent } from 'src/app/features/store-header/store-header.component';

@Component({
  selector: 'vex-sale-list',
  templateUrl: './sale-list.component.html',
  styleUrls: ['./sale-list.component.scss'],
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
    StoreHeaderComponent
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'fr' }, DatePipe]
})
export class SaleListComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort!: MatSort;

  layoutCtrl = new UntypedFormControl('boxed');
  searchCtrl = new UntypedFormControl('');
  userConnet: CurrentUserAuth | null = null;

  dataSource!: MatTableDataSource<Sale>;
  sales: Sale[] = [];
  store!: Store;
  company!: Company;
  meta: PaginationMeta = { ...initialPaginationMeta };
  isLoading = true; // ← Flag de chargement

  @Input()
  columns: TableColumn<Sale>[] = [
    {
      label: 'Client',
      property: 'customer',
      type: 'text',
      visible: true,
      cssClasses: ['font-medium']
    },
    {
      label: 'Date de vente',
      property: 'sale_date',
      type: 'text',
      visible: true
    },
    {
      label: 'Montant avant réduction',
      property: 'gross_amount',
      type: 'text',
      visible: false
    },
    {
      label: 'Montant après réduction',
      property: 'total_amount',
      type: 'text',
      visible: true
    },
    {
      label: 'Réduction',
      property: 'discount',
      type: 'text',
      visible: false
    },
    {
      label: 'Status Vente',
      property: 'status',
      type: 'text',
      visible: true
    }
  ];

  constructor(
    private saleService: SaleService,
    private router: Router,
    private notificationService: NotificationService,
    private authService: AuthService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.dataSource = new MatTableDataSource();

    this.authService.getUserAuth().subscribe({
      next: (response) => {
        this.userConnet = response;
        const roleName = response.user?.role?.name?.toLowerCase();
        if (roleName === 'owner') {
          // Owner : récupérer le store depuis le state de navigation
          if (history.state.store && history.state.company) {
            this.store = history.state.store;
            this.company = history.state.company;
            this.initComponent();
          } else {
            this.onBack();
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
    this.loadSales();
    this.isLoading = false;
  }

  /** Lance la recherche à partir du bouton "Rechercher" (retour à la 1ère page). */
  search(): void {
    this.meta.current_page = 1;
    this.loadSales(this.searchCtrl.value || '');
  }

  /** Réinitialise la recherche et recharge la liste. */
  resetSearch(): void {
    this.searchCtrl.setValue('');
    this.meta.current_page = 1;
    this.loadSales('');
  }

  get visibleColumns() {
    return this.columns
      .filter((column) => column.visible)
      .map((column) => column.property)
      .concat(['actions']);
  }

  loadSales(searchTerm: string = ''): void {
    this.saleService
      .list(
        this.store.id,
        searchTerm,
        this.meta.current_page,
        this.meta.per_page
      )
      .subscribe({
        next: (response) => {
          this.sales = response.data || [];
          this.dataSource.data = this.sales;
          this.meta = response.meta || this.meta;
        },
        error: (error) => {
          this.notificationService.error(error.error.message);
        }
      });
  }

  pageEvent(event: PageEvent): void {
    this.meta.per_page = event.pageSize;
    this.meta.current_page = event.pageIndex + 1;
    this.loadSales(this.searchCtrl.value || '');
  }

  toggleColumnVisibility(column: TableColumn<any>, event: Event): void {
    event.stopPropagation();
    event.stopImmediatePropagation();
    column.visible = !column.visible;
  }

  newSale(): void {
    this.router.navigate(['index/manager/sale/add'], {
      state: { store: this.store, company: this.company }
    });
  }

  goToDetails(sale: Sale): void {
    this.router.navigate(['index/manager/sale/details'], {
      state: { sale: sale, store: this.store, company: this.company }
    });
  }

  validateSale(sale: Sale): void {
    Swal.fire({
      title: 'Valider cette vente ?',
      text: 'Cette action confirmera définitivement la vente',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Oui, valider',
      cancelButtonText: 'Annuler',
      customClass: {
        container: 'swal2-container-custom',
        popup: 'swal2-popup-custom',
        actions: 'swal2-actions-custom',
        confirmButton: 'swal2-confirm-custom',
        cancelButton: 'swal2-cancel-custom'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Validation en cours...',
          text: 'Veuillez patienter',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        this.saleService.validateSale(sale.id, this.store.id).subscribe({
          next: (response) => {
            Swal.fire({
              icon: 'success',
              title: 'Validée !',
              text: response.message || 'La vente a été validée avec succès.',
              timer: 2000,
              showConfirmButton: false
            });
            this.loadSales();
          },
          error: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text:
                error?.error?.message ||
                'Une erreur est survenue lors de la validation.',
              confirmButtonColor: '#d33',
              customClass: {
                container: 'swal2-container-custom',
                popup: 'swal2-popup-custom',
                actions: 'swal2-actions-custom',
                confirmButton: 'swal2-confirm-custom',
                cancelButton: 'swal2-cancel-custom'
              }
            });
          }
        });
      }
    });
  }

  cancelSale(sale: Sale): void {
    Swal.fire({
      title: 'Annuler cette vente ?',
      text: 'Cette action est irréversible',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Oui, annuler',
      cancelButtonText: 'Non',
      customClass: {
        container: 'swal2-container-custom',
        popup: 'swal2-popup-custom',
        actions: 'swal2-actions-custom',
        confirmButton: 'swal2-confirm-custom',
        cancelButton: 'swal2-cancel-custom'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Annulation en cours...',
          text: 'Veuillez patienter',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        this.saleService.CancelSale(sale.id, this.store.id).subscribe({
          next: (response) => {
            Swal.fire({
              icon: 'success',
              title: 'Annulée !',
              text: response.message || 'La vente a été annulée avec succès.',
              timer: 2000,
              showConfirmButton: false
            });
            this.loadSales();
          },
          error: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text:
                error?.error?.message ||
                "Une erreur est survenue lors de l'annulation.",
              confirmButtonColor: '#d33',
              customClass: {
                container: 'swal2-container-custom',
                popup: 'swal2-popup-custom',
                actions: 'swal2-actions-custom',
                confirmButton: 'swal2-confirm-custom',
                cancelButton: 'swal2-cancel-custom'
              }
            });
          }
        });
      }
    });
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      confirmed: 'Confirmée',
      pending: 'En attente',
      cancelled: 'Annulée'
    };
    return statusMap[status] || status;
  }

  download(sale: Sale): void {
    if (!sale.id) {
      console.error('ID de vente non défini');
      return;
    }

    // Récupérer les détails de la vente avec les lignes de vente
    this.saleService.getSaleById(sale.id).subscribe({
      next: (response) => {
        // Ouvrir le modal de reçu de caisse
        this.dialog.open(SaleReceiptModalComponent, {
          data: {
            saleDetails: response.data,
            store: this.store,
            company: this.company
          },
          width: '100%',
          maxWidth: '400px',
          panelClass: 'receipt-modal-dialog'
        });
      },
      error: (error) => {
        this.notificationService.error(
          error?.error?.message ||
            'Erreur lors de la récupération des détails de la vente'
        );
      }
    });
  }

  onBack = () => {
    this.router.navigate(['/index/owner/store'], {
      state: {
        store: this.store,
        company: this.userConnet?.company
      }
    });
  };
}
