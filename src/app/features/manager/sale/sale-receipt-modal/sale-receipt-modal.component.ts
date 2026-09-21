import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SaleDetails } from 'src/app/interfaces/Sale';
import { IntegerSeparatorPipe } from 'src/app/pipes/integer-separator.pipe';
import { FrenchDatePipe } from 'src/app/pipes/french-date.pipe';
import { Store } from 'src/app/interfaces/Store';
import { Company } from 'src/app/interfaces/Company';

@Component({
  selector: 'vex-sale-receipt-modal',
  templateUrl: './sale-receipt-modal.component.html',
  styleUrls: ['./sale-receipt-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    IntegerSeparatorPipe,
    FrenchDatePipe
  ]
})
export class SaleReceiptModalComponent {
  saleDetails: SaleDetails;
  store: Store;
  company: Company;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { saleDetails: SaleDetails; store: Store; company: Company },
    private dialogRef: MatDialogRef<SaleReceiptModalComponent>
  ) {
    this.saleDetails = data.saleDetails;
    this.store = data.store;
    this.company = data.company;
  }
  close(): void {
    this.dialogRef.close();
  }

  print(): void {
    window.print();
  }

  getPaymentStatusLabel(status: string): string {
    switch (status) {
      case 'paid':
        return 'Payée';
      case 'partial':
        return 'Partielle';
      case 'no_paid':
        return 'Non Payée';
      default:
        return 'Inconnu';
    }
  }

  // onLogoError(event: Event): void {
  //   (event.target as HTMLImageElement).style.display = 'none';
  // }
}
