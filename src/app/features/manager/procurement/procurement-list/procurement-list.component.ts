import {
  NgIf,
  NgFor,
  NgClass,
  CommonModule,
  DatePipe,
  registerLocaleData
} from '@angular/common';
import { Component, LOCALE_ID, OnDestroy, OnInit } from '@angular/core';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
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
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { VexPageLayoutContentDirective } from '@vex/components/vex-page-layout/vex-page-layout-content.directive';
import { Subject, take, takeUntil } from 'rxjs';
import {
  navigateStoreBack,
  readStoreNavigationState,
  resolveStoreContext
} from 'src/app/core/utils/store-context.util';
import { ProcurementService } from 'src/app/auth/services/procurement.service';
import { Company } from 'src/app/interfaces/Company';
import { Procurement } from 'src/app/interfaces/Procurement';
import { Store } from 'src/app/interfaces/Store';
import {
  initialPaginationMeta,
  PaginationMeta
} from 'src/app/response-type/Type';
import Swal from 'sweetalert2';
import localeFr from '@angular/common/locales/fr';
import { AuthService } from 'src/app/auth/services/auth.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { StoreHeaderComponent } from 'src/app/features/store-header/store-header.component';
import { IntegerSeparatorPipe } from 'src/app/pipes/integer-separator.pipe';

registerLocaleData(localeFr, 'fr');
@Component({
  selector: 'vex-procurement-list',
  templateUrl: './procurement-list.component.html',
  styleUrls: ['./procurement-list.component.scss'],
  standalone: true,
  imports: [
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
    MatDatepickerModule,
    StoreHeaderComponent,
    IntegerSeparatorPipe
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'fr' }, DatePipe]
})
export class ProcurementListComponent implements OnInit, OnDestroy {
  searchCtrl = new UntypedFormControl();
  procurements: Procurement[] = [];
  meta: PaginationMeta = { ...initialPaginationMeta };
  store!: Store;
  company: Company | null = null;
  isOwner = false;
  isReady = false;
  isLoading = true;
  private destroy$ = new Subject<void>();

  startDateControl = new FormControl<Date | null>(null);
  endDateControl = new FormControl<Date | null>(null);

  // Plage de dates active (appliquée après clic sur "Rechercher")
  activeDateRange: { start: Date | null; end: Date | null } = {
    start: null,
    end: null
  };

  constructor(
    private router: Router,
    private procurementService: ProcurementService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const navState = readStoreNavigationState();

    this.authService
      .getUserAuth()
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const context = resolveStoreContext(response, navState);
          if (!context) {
            this.goBack();
            return;
          }
          this.store = context.store;
          this.company = context.company ?? null;
          this.isOwner = context.isOwner;
          this.isReady = true;
          this.initComponent();
        },
        error: (err) => {
          console.error("Erreur lors de la récupération de l'utilisateur", err);
          this.isLoading = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initComponent(): void {
    this.loadProcurements();
    this.isLoading = false;
  }

  loadProcurements(
    page = this.meta.current_page,
    perPage = this.meta.per_page
  ): void {
    const searchTerm = this.searchCtrl.value ?? '';
    const startDate = this.formatDate(this.activeDateRange.start);
    const endDate = this.formatDate(this.activeDateRange.end);

    this.procurementService
      .list(this.store.id, searchTerm, page, perPage, startDate, endDate)
      .subscribe({
        next: (response) => {
          this.procurements = response.data;
          this.meta = response.meta;
        }
      });
  }

  /** Déclenche la recherche (texte + plage de dates) via le bouton "Rechercher" */
  search(): void {
    let start = this.startDateControl.value;
    let end = this.endDateControl.value;

    // Si les dates sont inversées, on les remet dans le bon ordre
    if (start && end && start.getTime() > end.getTime()) {
      [start, end] = [end, start];
      this.startDateControl.setValue(start);
      this.endDateControl.setValue(end);
    }

    this.activeDateRange = { start, end };
    this.meta.current_page = 1;
    this.loadProcurements(1, this.meta.per_page);
  }

  /** Réinitialise tous les filtres */
  resetFilters(): void {
    this.searchCtrl.setValue('');
    this.startDateControl.setValue(null);
    this.endDateControl.setValue(null);
    this.activeDateRange = { start: null, end: null };
    this.meta.current_page = 1;
    this.loadProcurements(1, this.meta.per_page);
  }

  /** Retourne true si un filtre de dates est actuellement actif */
  get hasActiveDateFilter(): boolean {
    return !!(this.activeDateRange.start || this.activeDateRange.end);
  }

  /** Formate l'intervalle actif en français pour l'affichage */
  get activeDateRangeLabel(): string {
    const opts: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    };
    const locale = 'fr-FR';

    if (this.activeDateRange.start && this.activeDateRange.end) {
      const start = this.activeDateRange.start.toLocaleDateString(locale, opts);
      const end = this.activeDateRange.end.toLocaleDateString(locale, opts);
      return `Entre le ${start} et le ${end}`;
    }
    if (this.activeDateRange.start) {
      return `À partir du ${this.activeDateRange.start.toLocaleDateString(
        locale,
        opts
      )}`;
    }
    if (this.activeDateRange.end) {
      return `Jusqu'au ${this.activeDateRange.end.toLocaleDateString(
        locale,
        opts
      )}`;
    }
    return '';
  }

  goBack = (): void => {
    navigateStoreBack(this.router, {
      isOwner: this.isOwner,
      store: this.store,
      company: this.company
    });
  };

  newProcurement(): void {
    this.router.navigate(['/index/manager/procurement/add'], {
      state: { store: this.store, company: this.company }
    });
  }

  pageEvent(page: PageEvent): void {
    this.meta.per_page = page.pageSize;
    this.meta.current_page = page.pageIndex + 1;
    this.loadProcurements(this.meta.current_page, this.meta.per_page);
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'received':
        return 'Reçu';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  }

  edit(data: Procurement): void {
    this.router.navigate(['/index/manager/procurement/add'], {
      state: {
        store: this.store,
        company: this.company,
        procurement: data,
        isUpdateMode: true
      }
    });
  }

  details(data: Procurement): void {
    this.router.navigate(['/index/manager/procurement/details'], {
      state: { store: this.store, company: this.company, procurement: data }
    });
  }

  validateProcurement(procurement: Procurement): void {
    Swal.fire({
      title: 'Confirmation',
      text: `Voulez-vous vraiment valider l'approvisionnement "${procurement.order_number}" ?`,
      icon: 'question',
      showCancelButton: true,
      buttonsStyling: false,
      confirmButtonText: 'Oui, valider',
      cancelButtonText: 'Non',
      customClass: {
        confirmButton: 'swal2-confirm-custom',
        cancelButton: 'swal2-cancel-custom',
        actions: 'swal2-actions-custom'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Validation en cours...',
          text: 'Veuillez patienter',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        this.procurementService
          .validate(this.store.id, procurement.id)
          .subscribe({
            next: (response) => {
              Swal.fire({
                icon: 'success',
                title: 'Validé !',
                text:
                  response.message ||
                  "L'approvisionnement a été validé avec succès et le stock a été mis à jour.",
                timer: 2000,
                showConfirmButton: false
              });
              this.loadProcurements();
            },
            error: (error) => {
              Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text:
                  error?.error?.message ||
                  'Une erreur est survenue lors de la validation.',
                confirmButtonColor: '#d33'
              });
            }
          });
      }
    });
  }

  cancelProcurement(procurement: Procurement): void {
    Swal.fire({
      title: 'Confirmation',
      text: `Voulez-vous vraiment annuler l'approvisionnement "${procurement.order_number}" ?`,
      icon: 'warning',
      showCancelButton: true,
      buttonsStyling: false,
      confirmButtonText: 'Oui, annuler',
      cancelButtonText: 'Non',
      customClass: {
        confirmButton: 'swal2-confirm-custom',
        cancelButton: 'swal2-cancel-custom',
        actions: 'swal2-actions-custom'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Annulation en cours...',
          text: 'Veuillez patienter',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        this.procurementService
          .cancel(this.store.id, procurement.id)
          .subscribe({
            next: (response) => {
              Swal.fire({
                icon: 'success',
                title: 'Annulé !',
                text:
                  response.message ||
                  "L'approvisionnement a été annulé avec succès.",
                timer: 2000,
                showConfirmButton: false
              });
              this.loadProcurements();
            },
            error: (error) => {
              Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text:
                  error?.error?.message ||
                  "Une erreur est survenue lors de l'annulation.",
                confirmButtonColor: '#d33'
              });
            }
          });
      }
    });
  }

  private formatDate(date: Date | null | undefined): string | undefined {
    if (!date) return undefined;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
