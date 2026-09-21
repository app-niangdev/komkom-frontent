import { CommonModule, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { fadeInRight400ms } from '@vex/animations/fade-in-right.animation';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { scaleIn400ms } from '@vex/animations/scale-in.animation';
import { stagger40ms } from '@vex/animations/stagger.animation';
import { AuthService } from 'src/app/auth/services/auth.service';
import { CompanyService } from 'src/app/auth/services/company.service';
import { NotificationService } from 'src/app/auth/services/Notification.service';
import { Company } from 'src/app/interfaces/Company';
import { UploadFileComponent } from 'src/app/layouts/components/upload-file/upload-file.component';
import { CurrentUserAuth } from 'src/app/response-type/Type';

@Component({
  selector: 'vex-company-show-update',
  templateUrl: './company-show-update.component.html',
  styleUrls: ['./company-show-update.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    NgIf,
    MatButtonModule,
    MatTooltipModule,
    UploadFileComponent,
    MatFormFieldModule,
    CommonModule
  ],
  animations: [fadeInUp400ms, fadeInRight400ms, scaleIn400ms, stagger40ms]
})
export class CompanyShowUpdateComponent {
  currentUserAuth!: CurrentUserAuth;
  isUpdateMode: boolean = false;
  isSubmitting: boolean = false;
  company!: Company;
  companyForm!: FormGroup;
  uploadedFile: File | null = null;
  logoPreviewUrl: string | null = null;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private companyService: CompanyService,
    private notif: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadData();

    // S'abonner aux mises à jour en temps réel
    this.authService.getCurrentUserAuth().subscribe({
      next: (response) => {
        if (response) {
          this.currentUserAuth = response;
          this.company = response.company;
          if (this.companyForm) {
            this.initializeForm(this.company);
          }
          this.logoPreviewUrl = this.company.logo_url || null;
        }
      }
    });
  }

  loadData() {
    this.authService.getUserAuth().subscribe({
      next: (response) => {
        this.currentUserAuth = response;
        this.company = response.company;
        this.initializeForm(this.company);
        this.logoPreviewUrl = this.company.logo_url || null;
      }
    });
  }

  initializeForm(company: Company): void {
    this.companyForm = this.fb.group({
      name: [
        company.name,
        [
          Validators.required,
          Validators.minLength(4),
          Validators.maxLength(255)
        ]
      ],
      short_name: [
        company.short_name,
        [Validators.minLength(2), Validators.maxLength(50)]
      ],
      slogan: [
        company.slogan,
        [Validators.minLength(2), Validators.maxLength(255)]
      ],
      head_office_address: [
        company.head_office_address,
        Validators.maxLength(255)
      ],
      email_company: [
        company.email,
        [
          Validators.required,
          Validators.email,
          Validators.minLength(8),
          Validators.maxLength(50),
          Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')
        ]
      ],
      phone_one: [
        company.phone_one,
        [Validators.required, Validators.minLength(9), Validators.maxLength(20)]
      ],
      phone_two: [company.phone_two, Validators.maxLength(20)],
      primary_color: [company.primary_color || '#0d6efd'],
      secondary_color: [company.secondary_color || '#6c757d'],
      logo: [null]
    });
  }

  toggleEdit(): void {
    this.isUpdateMode = !this.isUpdateMode;
    if (!this.isUpdateMode) {
      // Réinitialiser le formulaire si on annule
      this.initializeForm(this.company);
      this.uploadedFile = null;
    }
  }

  onFileUpload(file: File): void {
    this.uploadedFile = file;
    this.companyForm.patchValue({ logo: file });
  }

  onFileRemove(): void {
    this.uploadedFile = null;
    this.companyForm.patchValue({ logo: null });
  }

  onSubmit(): void {
    if (this.companyForm.invalid) {
      this.companyForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const formData = new FormData();
    formData.append('_method', 'PUT');
    Object.entries(this.companyForm.value).forEach(([key, value]) => {
      if (value !== null && value !== undefined)
        formData.append(key, value as any);
    });
    if (this.uploadedFile) formData.append('logo', this.uploadedFile);

    this.companyService.updateOnlyCompany(this.company.id, formData).subscribe({
      next: (response) => {
        this.notif.success(response.message);
        this.isSubmitting = false;
        this.isUpdateMode = false;
        // Rafraîchir les données dans tous les composants
        this.authService.refreshUserAuth().subscribe();
      },
      error: (error) => {
        this.notif.error(error.error);
        this.isSubmitting = false;
      }
    });
  }

  get f() {
    return this.companyForm.controls;
  }
}
