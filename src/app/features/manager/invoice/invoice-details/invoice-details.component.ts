import { Component, OnInit, LOCALE_ID } from '@angular/core';
import { Location, CommonModule, registerLocaleData } from '@angular/common';
import { InvoiceService } from 'src/app/auth/services/invoice.service';
import { Invoice } from 'src/app/interfaces/Invoice';
import { Customer, Payment, Sale } from 'src/app/interfaces/Payment';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { KomkomPageLoaderComponent } from 'src/app/layouts/components/page-loader/page-loader.component';
import { MatDividerModule } from '@angular/material/divider';
import { IntegerSeparatorPipe } from 'src/app/pipes/integer-separator.pipe';
import localeFr from '@angular/common/locales/fr';

registerLocaleData(localeFr, 'fr');

@Component({
  selector: 'vex-invoice-details',
  templateUrl: './invoice-details.component.html',
  styleUrls: ['./invoice-details.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    KomkomPageLoaderComponent,
    MatDividerModule,
    IntegerSeparatorPipe
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'fr' }]
})
export class InvoiceDetailsComponent implements OnInit {
  invoice: Invoice | null = null;
  sale: Sale | null = null;
  customer: Customer | null = null;
  payments: Payment[] = [];
  isLoading = true;

  displayedColumns: string[] = ['date', 'payment_type', 'amount'];
  productColumns: string[] = ['product', 'quantity', 'unit_price', 'subtotal', 'serial_numbers'];

  constructor(
    private location: Location,
    private invoiceService: InvoiceService
  ) {}

  ngOnInit(): void {
    const state = this.location.getState() as { invoice: Invoice };

    if (state && state.invoice) {
      this.invoice = state.invoice;
      this.loadInvoiceDetails();
    } else {
      this.goBack();
    }
  }

  loadInvoiceDetails(): void {
    if (!this.invoice?.id) {
      this.isLoading = false;
      return;
    }

    this.invoiceService.getInvoiceDetails(this.invoice.id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.invoice = response.data.invoice;
          this.sale = response.data.sale;
          this.customer = response.data.customer;
          this.payments = response.data.payments;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des détails de la facture', err);
        this.isLoading = false;
      }
    });
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'paid':
        return 'Payée';
      case 'partial':
        return 'Partiellement payée';
      case 'no_paid':
        return 'Non payée';
      case 'cancelled':
        return 'Annulée';
      default:
        return 'Inconnu';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'paid':
        return 'status-paid';
      case 'partial':
        return 'status-partial';
      case 'no_paid':
        return 'status-unpaid';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  }

  getPaymentTypeLabel(type: string): string {
    switch (type.toLowerCase()) {
      case 'cash':
        return 'Espèces';
      case 'wave':
        return 'Wave';
      case 'om':
        return 'Orange Money';
      default:
        return type;
    }
  }

  goBack(): void {
    this.location.back();
  }
}
