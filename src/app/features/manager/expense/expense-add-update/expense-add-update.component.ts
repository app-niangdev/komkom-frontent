import { Component, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { NotificationService } from 'src/app/auth/services/Notification.service';
import { Store } from 'src/app/interfaces/Store';
import { SupplierAddUpdateComponent } from '../../supplier/supplier-add-update/supplier-add-update.component';
import { Expense } from 'src/app/interfaces/Expense';
import { ExpenseService } from 'src/app/auth/services/expense.service';
import { NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { fadeInRight400ms } from '@vex/animations/fade-in-right.animation';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { scaleIn400ms } from '@vex/animations/scale-in.animation';
import { stagger80ms } from '@vex/animations/stagger.animation';
import { MatDatepickerModule } from '@angular/material/datepicker';

@Component({
  selector: 'vex-expense-add-update',
  templateUrl: './expense-add-update.component.html',
  styleUrls: ['./expense-add-update.component.scss'],
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
        MatProgressSpinnerModule,
        MatDatepickerModule
      ],
})
export class ExpenseAddUpdateComponent {
  form!: FormGroup;
  store!: Store;
  isEditMode: boolean = false;
  expenseSelected!: Expense;
  isSubmitting: boolean = false;

  constructor(
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<SupplierAddUpdateComponent>,
    private expenseService: ExpenseService,
    private notificationService: NotificationService,
  ) {
    this.isEditMode = data.isEditMode;
    this.expenseSelected = data.expense || {};
    this.store = data.store;
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      title: [
        this.expenseSelected.title || '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(254)
        ]
      ],
      amount: [
        this.expenseSelected.amount || '',
        [Validators.required, Validators.min(5), Validators.pattern('^[0-9]*$')]
      ],
      expense_date: [
        this.expenseSelected.expense_date || '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(254)
        ]
      ],
      description: [
        this.expenseSelected.description || '',
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
    const newExpense = this.form.value;
    this.expenseService.add(newExpense).subscribe({
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
    if (!this.form.valid || !this.expenseSelected || !this.isEditMode) return;
    const updateExpense = this.form.value;
    this.expenseService
      .update(this.expenseSelected.id, updateExpense)
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
