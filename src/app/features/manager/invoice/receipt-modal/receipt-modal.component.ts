import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Invoice } from 'src/app/interfaces/Invoice';
import { IntegerSeparatorPipe } from 'src/app/pipes/integer-separator.pipe';
import { FrenchDatePipe } from 'src/app/pipes/french-date.pipe';
import { Store } from 'src/app/interfaces/Store';

@Component({
  selector: 'vex-receipt-modal',
  templateUrl: './receipt-modal.component.html',
  styleUrls: ['./receipt-modal.component.scss'],
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
export class ReceiptModalComponent {
  invoice: Invoice;
  store: Store;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { invoice: Invoice; store: Store },
    private dialogRef: MatDialogRef<ReceiptModalComponent>
  ) {
    this.invoice = data.invoice;
    this.store = data.store;
  }

  close(): void {
    this.dialogRef.close();
  }

  print(): void {
    window.print();
  }

  getPaymentTypeLabel(type: string): string {
    switch (type) {
      case 'cash':
        return 'Espèces';
      case 'wave':
        return 'Wave';
      case 'OM':
        return 'Orange Money';
      default:
        return type;
    }
  }
}
