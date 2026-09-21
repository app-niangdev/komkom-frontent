import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  FormatSerialNumber,
  PayloadUpdateSerialNumber,
  SerialNumber
} from 'src/app/interfaces/SerialNumber';
import { EmeiService } from 'src/app/auth/services/imei.service';
import { NotificationService } from 'src/app/auth/services/Notification.service';
import { Store } from 'src/app/interfaces/Store';

export interface SerialNumberEditDialogData {
  serialNumber: FormatSerialNumber;
  store: Store;
}

@Component({
  selector: 'vex-emei-update',
  templateUrl: './emei-update.component.html',
  styleUrls: ['./emei-update.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule
  ]
})
export class EmeiUpdateComponent implements OnInit {
  serialNumberCtrl!: FormControl<string>;
  saving = false;

  constructor(
    private imeiService: EmeiService,
    private notificationService: NotificationService,
    public dialogRef: MatDialogRef<EmeiUpdateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SerialNumberEditDialogData
  ) {}

  ngOnInit(): void {
    this.serialNumberCtrl = new FormControl(
      this.data.serialNumber.serial_number ?? '',
      {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8)]
      }
    );
  }

  getStatusClass(isSold: boolean): string {
    return isSold
      ? 'px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700'
      : 'px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700';
  }

  getStatusLabel(isSold: boolean): string {
    return isSold ? 'Vendu' : 'Disponible';
  }

  save(): void {
    if (this.serialNumberCtrl.invalid) return;
    this.saving = true;
    const payload: PayloadUpdateSerialNumber = {
      id: this.data.serialNumber.id,
      store_id: this.data.store.id,
      serial_number: this.serialNumberCtrl.value
    };
    this.imeiService.update(this.data.serialNumber.id, payload).subscribe({
      next: (response) => {
        this.notificationService.success(response.message);
        this.dialogRef.close(true);
      },
      error: (error) => {
        if (error.error.status == false) {
          this.notificationService.error(error.error.message);
          this.dialogRef.close(true);
        }
        if (error.error.errors.serial_number[0]) {
          this.notificationService.error(error.error.errors.serial_number[0]);
          this.dialogRef.close(true);
        }
        this.dialogRef.close(true);
      }
    });
  }
}
