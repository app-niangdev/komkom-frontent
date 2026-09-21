import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { fadeInRight400ms } from '@vex/animations/fade-in-right.animation';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { scaleIn400ms } from '@vex/animations/scale-in.animation';
import { stagger80ms } from '@vex/animations/stagger.animation';
import { CommonModule } from '@angular/common';
import { IntegerSeparatorPipe } from 'src/app/pipes/integer-separator.pipe';
import { InvoiceService } from 'src/app/auth/services/invoice.service';
import { Invoice } from 'src/app/interfaces/Invoice';
import { Payment, Sale } from 'src/app/interfaces/Payment';

@Component({
  selector: 'vex-paiement-invoice',
  templateUrl: './paiement-invoice.component.html',
  styleUrls: ['./paiement-invoice.component.scss'],
  standalone:true,
  animations: [stagger80ms, fadeInUp400ms, scaleIn400ms, fadeInRight400ms],
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    IntegerSeparatorPipe,
    CommonModule,
    MatProgressSpinnerModule
]
})
export class PaiementInvoiceComponent implements OnInit {
  paymentForm: FormGroup;
  isSubmitting = false;
  mainFrameLoading:boolean=false;
  sale: Sale | null = null;
  isLoadingSale = false;
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<PaiementInvoiceComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { invoice: Invoice },
    private invoiceService: InvoiceService,
    private snackBar: MatSnackBar
  ) {
    this.paymentForm = this.fb.group({
      date: ['', Validators.required],
      amount: [
        this.data.invoice.balance,
        [
          Validators.required,
          Validators.min(5),
          Validators.max(this.data.invoice.balance)
        ]
      ],
      payment_type: ['cash', Validators.required],
      invoice_id: [this.data.invoice.id],
      user_id: [1] // This should be replaced with the actual logged-in user ID
    });
  }

  ngOnInit(): void {
    this.loadSaleDetails();
  }

  loadSaleDetails(): void {
    if (!this.data.invoice?.id) {
      return;
    }

    this.isLoadingSale = true;
    this.invoiceService.getInvoiceDetails(this.data.invoice.id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.sale = response.data.sale;
        }
        this.isLoadingSale = false;
      },
      error: (error) => {
        this.isLoadingSale = false;
        console.error('Erreur lors du chargement des produits de la vente', error);
      }
    });
  }

  submitPayment(): void {
    if (this.paymentForm.invalid) {
      return
    }

    this.isSubmitting = true
    const payment: Payment = this.paymentForm.value

    // Convert date to string format
    // payment.date = this.formatDate(payment.date)

    this.invoiceService.addPayment(payment, this.data.invoice.id).subscribe({
      next: (response) => {
        this.isSubmitting = false
        this.snackBar.open("Paiement effectué avec succès", "Fermer", {
          duration: 3000,
          panelClass: ["success-snackbar"],
        })
        this.dialogRef.close(true)
      },
      error: (error) => {
        this.isSubmitting = false
        this.snackBar.open("Erreur lors du paiement", "Fermer", {
          duration: 3000,
          panelClass: ["error-snackbar"],
        })
        console.error("Payment error:", error)
      },
    })
  }

  private formatDate(date: Date): string {
    // Format date as YYYY-MM-DD
    return date.toISOString().split("T")[0]
  }
}

