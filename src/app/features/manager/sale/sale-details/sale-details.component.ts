import {
  NgFor,
  NgIf,
  NgClass,
  CommonModule,
  DatePipe,
  registerLocaleData
} from '@angular/common';
import { Component, LOCALE_ID, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import localeFr from '@angular/common/locales/fr';
import { SaleDetails, SaleDetailsResponse } from 'src/app/interfaces/Sale';
import { Store } from 'src/app/interfaces/Store';
import { Company } from 'src/app/interfaces/Company';
import { Router } from '@angular/router';
import { SaleService } from 'src/app/auth/services/sale.service';
import { NotificationService } from 'src/app/auth/services/Notification.service';
import Swal from 'sweetalert2';
import { KomkomPageLoaderComponent } from 'src/app/layouts/components/page-loader/page-loader.component';
registerLocaleData(localeFr, 'fr');

@Component({
  selector: 'vex-sale-details',
  templateUrl: './sale-details.component.html',
  styleUrls: ['./sale-details.component.scss'],
  standalone: true,
  imports: [
    MatButtonToggleModule,
    ReactiveFormsModule,
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
    NgIf,
    NgClass,
    MatPaginatorModule,
    FormsModule,
    MatDialogModule,
    MatInputModule,
    MatSnackBarModule,
    CommonModule,
    MatSlideToggleModule,
    MatCardModule,
    MatDividerModule,
    KomkomPageLoaderComponent
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'fr' }, DatePipe]
})
export class SaleDetailsComponent implements OnInit {
  sale: SaleDetails | null = null;
  store: Store | null = null;
  company: Company | null = null;
  displayedColumns: string[] = [
    'product',
    'quantity',
    'unit_price',
    'subtotal',
    'serial_numbers'
  ];
  isLoading = false;

  constructor(
    private router: Router,
    private saleService: SaleService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state || history.state;
    const saleFromState = state['sale'];
    this.store = state['store'];
    this.company = state['company'];

    // Si on a une vente de base, charger les détails complets
    if (saleFromState?.id && this.store && this.company) {
      this.isLoading = true;
      this.saleService.getSaleById(saleFromState.id).subscribe({
        next: (response) => {
          this.sale = response.data;
          this.isLoading = false;
        },
        error: (error) => {
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text:
              error?.error?.message ||
              'Impossible de charger les détails de la vente.',
            confirmButtonColor: '#d33'
          });
          this.isLoading = false;
          this.goBack();
        }
      });
    } else {
      this.goBack();
    }
  }

  goBack(): void {
    this.router.navigate(['/index/manager/sale/list'], {
      state: { store: this.store, company: this.company }
    });
  }

  getStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      pending: 'bg-orange-500/10 text-orange-500',
      confirmed: 'bg-green-500/10 text-green-500',
      cancelled: 'bg-red-500/10 text-red-500'
    };
    return classMap[status] || '';
  }

  getStatusLabel(status: string): string {
    const labelMap: { [key: string]: string } = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      cancelled: 'Annulée'
    };
    return labelMap[status] || status;
  }

  canValidate(): boolean {
    return this.sale?.status === 'pending';
  }

  canCancel(): boolean {
    return this.sale?.status === 'pending';
  }

  validateSale(): void {
    if (!this.sale || !this.store) return;

    Swal.fire({
      title: 'Confirmation',
      text: 'Êtes-vous sûr de vouloir valider cette vente ?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6c757d',
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

        this.isLoading = true;

        this.saleService.validateSale(this.sale!.id, this.store!.id).subscribe({
          next: (response) => {
            Swal.fire({
              icon: 'success',
              title: 'Validée !',
              text: response.message || 'La vente a été validée avec succès.',
              timer: 2000,
              showConfirmButton: false
            });

            if (this.sale) {
              this.sale.status = 'confirmed';
            }
            this.isLoading = false;
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
            this.isLoading = false;
          }
        });
      }
    });
  }

  cancelSale(): void {
    if (!this.sale || !this.store) return;

    Swal.fire({
      title: 'Confirmation',
      text: 'Êtes-vous sûr de vouloir annuler cette vente ? Cette action est irréversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, annuler la vente',
      cancelButtonText: 'Non, garder la vente',
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

        this.isLoading = true;

        this.saleService.CancelSale(this.sale!.id, this.store!.id).subscribe({
          next: (response) => {
            Swal.fire({
              icon: 'success',
              title: 'Annulée !',
              text: response.message || 'La vente a été annulée avec succès.',
              timer: 2000,
              showConfirmButton: false
            });

            if (this.sale) {
              this.sale.status = 'cancelled';
            }
            this.isLoading = false;
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
            this.isLoading = false;
          }
        });
      }
    });
  }
}
