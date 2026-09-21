import { NgIf } from '@angular/common';
import { Component, Inject } from '@angular/core';
import {
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
  Validators
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import {
  MatSnackBarModule,
  MatSnackBar,
  MatSnackBarConfig
} from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { fadeInRight400ms } from '@vex/animations/fade-in-right.animation';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { scaleIn400ms } from '@vex/animations/scale-in.animation';
import { stagger80ms } from '@vex/animations/stagger.animation';
import { CompanyService } from 'src/app/auth/services/company.service';
import { NotificationService } from 'src/app/auth/services/Notification.service';
import { UploadFileComponent } from 'src/app/layouts/components/upload-file/upload-file.component';

@Component({
  selector: 'vex-company-store-add',
  templateUrl: './company-store-add.component.html',
  styleUrls: ['./company-store-add.component.scss'],
  animations: [stagger80ms, scaleIn400ms, fadeInRight400ms, fadeInUp400ms],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    NgIf,
    MatButtonModule,
    MatCheckboxModule,
    MatMenuModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    UploadFileComponent
  ]
})
export class CompanyStoreAddComponent {
  form!: FormGroup;
  isUpdateMode = false;
  isSubmitting = false;
  company: any;
  storeUpdate: any;
  title: string = '';
  uploadedLogo: File | null = null;
  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private router: Router,
    private companyService: CompanyService,
    private notify: NotificationService,

    public dialogRef: MatDialogRef<CompanyStoreAddComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data.company) {
      this.company = this.data.company;
      this.storeUpdate = this.data.store;
      this.title = this.data.title;
      this.isUpdateMode = this.data.isUpdateMode;
    }
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      name: [
        this.isUpdateMode ? this.storeUpdate.name : '',
        [Validators.required, Validators.maxLength(255)]
      ],
      slogan: [
        this.isUpdateMode ? this.storeUpdate.slogan : '',
        [Validators.maxLength(255)]
      ],
      address: [
        this.isUpdateMode ? this.storeUpdate.address : '',
        [Validators.required, Validators.maxLength(255)]
      ],
      email: [
        this.isUpdateMode ? this.storeUpdate.email : '',
        [Validators.required, Validators.email, Validators.maxLength(255)]
      ],
      phone_one: [
        this.isUpdateMode ? this.storeUpdate.phone_one : '',
        [
          Validators.required,
          Validators.maxLength(20),
          Validators.pattern('^[0-9]*$')
        ]
      ],
      phone_two: [
        this.isUpdateMode ? this.storeUpdate.phone_two : '',
        [Validators.maxLength(20), Validators.pattern('^[0-9]*$')]
      ],
      phone_three: [
        this.isUpdateMode ? this.storeUpdate.phone_three : '',
        [Validators.maxLength(20), Validators.pattern('^[0-9]*$')]
      ],
      uses_measurements: [
        this.isUpdateMode
          ? this.storeUpdate?.uses_measurements !== false
          : true
      ],
      use_company_logo: [
        this.isUpdateMode ? this.storeUpdate?.use_company_logo !== false : true
      ],
      use_company_colors: [
        this.isUpdateMode
          ? this.storeUpdate?.use_company_colors !== false
          : true
      ],
      primary_color: [
        this.isUpdateMode
          ? this.storeUpdate?.primary_color || this.company?.primary_color || '#0d6efd'
          : this.company?.primary_color || '#0d6efd'
      ],
      secondary_color: [
        this.isUpdateMode
          ? this.storeUpdate?.secondary_color || this.company?.secondary_color || '#6c757d'
          : this.company?.secondary_color || '#6c757d'
      ],
      company_id: [this.company?.id]
    });
  }

  get storeLogoUrl(): string | null {
    return this.isUpdateMode ? this.storeUpdate?.logo_url || null : null;
  }

  onLogoUpload(file: File): void {
    this.uploadedLogo = file;
  }

  onLogoRemove(): void {
    this.uploadedLogo = null;
  }

  private buildFormData(): FormData {
    const formData = new FormData();
    Object.entries(this.form.value).forEach(([key, value]) => {
      if (value === null || value === undefined) return;
      formData.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : (value as any));
    });
    if (this.uploadedLogo) {
      formData.append('logo', this.uploadedLogo);
    }
    return formData;
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formData = this.buildFormData();

    if (this.isUpdateMode) {
      this.companyService
        .updateStoreWithBranding(this.storeUpdate.id, formData)
        .subscribe({
          next: (response) => {
            this.notify.success(response.message);
            this.dialogRef.close(true);
            this.isSubmitting = false;
          },
          error: (error) => {
            this.notify.error(error);
            this.isSubmitting = false;
          }
        });
    } else {
      this.companyService.addStoreWithBranding(formData).subscribe({
        next: (response) => {
          this.notify.success(response.message);
          this.dialogRef.close(true);
          this.isSubmitting = false;
        },
        error: (error) => {
          this.notify.error(error);
          this.isSubmitting = false;
        }
      });
    }
  }

  private showMessage(message: string, panelClass: string) {
    const config = new MatSnackBarConfig();
    config.duration = 4000;
    config.horizontalPosition = 'end';
    config.verticalPosition = 'top';
    config.panelClass = [panelClass];
    this.snackBar.open(message, 'Fermer', config);
  }

  close() {
    this.dialogRef.close(false);
  }
}
