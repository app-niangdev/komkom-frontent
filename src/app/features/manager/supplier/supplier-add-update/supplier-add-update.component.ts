import { NgIf } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { fadeInRight400ms } from '@vex/animations/fade-in-right.animation';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { scaleIn400ms } from '@vex/animations/scale-in.animation';
import { stagger80ms } from '@vex/animations/stagger.animation';
import { NotificationService } from 'src/app/auth/services/Notification.service';
import { SupplierService } from 'src/app/auth/services/supplier.service';
import { Store } from 'src/app/interfaces/Store';
import { Supplier } from 'src/app/interfaces/Supplier';

@Component({
  selector: 'vex-supplier-add-update',
  templateUrl: './supplier-add-update.component.html',
  styleUrls: ['./supplier-add-update.component.scss'],
  animations: [stagger80ms, scaleIn400ms, fadeInRight400ms, fadeInUp400ms],
  standalone: true,
  imports: [
      ReactiveFormsModule,
      MatDialogModule,
      NgIf,
      MatButtonModule,
      MatMenuModule,
      MatIconModule,
      MatDividerModule,
      MatSelectModule,
      MatFormFieldModule,
      MatInputModule,
      MatSnackBarModule,
      MatProgressBarModule,
      MatProgressSpinnerModule
    ],
})
export class SupplierAddUpdateComponent {
  form!: FormGroup;
  store!: Store;
  selectedFile: File | null = null;
  imageUrl: string = '';
  messageCtrlImg: string = '';
  isFailedImg: boolean = false;
  isEditMode: boolean = false;
  supplierSelected!: Supplier;
  selected_subjects: number[] = [];
  tenant_id: string | null = null;
  isSubmitting: boolean = false;

  constructor(
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<SupplierAddUpdateComponent>,
    private supplierService: SupplierService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.isEditMode = data.isEditMode;
    this.supplierSelected = data.supplier || {};
    this.store = data.store;
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      name: [
        this.supplierSelected.name || '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(254)
        ]
      ],
      email: [
        this.supplierSelected.email || '',
        [
          Validators.minLength(8),
          Validators.maxLength(254),
          Validators.email,
          Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')
        ]
      ],
      phone_one: [
        this.supplierSelected.phone_one || '',
        [
          Validators.required,
          Validators.minLength(9),
          Validators.maxLength(9),
          Validators.pattern('^[0-9]*$')
        ]
      ],
      phone_two: [
        this.supplierSelected.phone_two || '',
        [
          Validators.minLength(9),
          Validators.maxLength(9),
          Validators.pattern('^[0-9]*$')
        ]
      ],
      address: [
        this.supplierSelected.address || '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(254)
        ]
      ],
      store_id: this.store.id
    });
  }

  save() {
    if (this.isEditMode) {
      this.update();
    }else{
      this.add();
    }
  }

  add(){
    if (!this.form.valid) return;
    this.isSubmitting = true;
    const newSupplier = this.form.value;
    this.supplierService.add(newSupplier).subscribe({
      next: (response) => {
        if (response.status == true) {
          this.notificationService.success(response.message);
          this.close();
          this.isSubmitting = false;
        }
        if (response.status == false) {
          this.notificationService.error(response.message);
          this.close();
          this.isSubmitting = false;
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        if (error.error.status == false) {
          this.notificationService.error(error.error.message);
          this.close();
        }
        this.close();
      }
    });
  }

  update() {
    if (!this.form.valid || !this.supplierSelected || !this.isEditMode) return;
    const updateSupplier = this.form.value;
    this.supplierService
      .update(this.supplierSelected.id, updateSupplier)
      .subscribe({
        next: (response) => {
          this.notificationService.success(response.message);
          this.close();
        },
        error: (error) => {
          if (error.error.status == false) {
            this.notificationService.error(error.error.message);
            this.close();
          }
          console.log(error);
          this.close();
        }
      });
  }

  close() {
    this.dialogRef.close(true);
  }
}
