import { NgIf, NgFor, NgClass, CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  ReactiveFormsModule,
  FormsModule,
  FormGroup,
  FormBuilder,
  Validators
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
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
import { fadeInRight400ms } from '@vex/animations/fade-in-right.animation';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { scaleIn400ms } from '@vex/animations/scale-in.animation';
import { stagger80ms } from '@vex/animations/stagger.animation';
import { VexPageLayoutContentDirective } from '@vex/components/vex-page-layout/vex-page-layout-content.directive';
import { MatStepperModule } from '@angular/material/stepper';
import { Router } from '@angular/router';
import { CompanyService } from 'src/app/auth/services/company.service';
import { NotificationService } from 'src/app/auth/services/Notification.service';
import { Company } from 'src/app/interfaces/Company';

@Component({
  selector: 'vex-company-add',
  templateUrl: './company-add.component.html',
  styleUrls: ['./company-add.component.scss'],
  animations: [stagger80ms, fadeInUp400ms, scaleIn400ms, fadeInRight400ms],
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
    MatPaginatorModule,
    FormsModule,
    MatDialogModule,
    MatInputModule,
    MatSnackBarModule,
    CommonModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatStepperModule
  ]
})
export class CompanyAddComponent {
  private companyService = inject(CompanyService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private notify = inject(NotificationService);

  isSubmitting: boolean = false;
  isUpdateMode: boolean = false;
  existErrorMessage: boolean = false;
  errorMessage!: string;
  userForm!: FormGroup;
  companyForm!: FormGroup;
  companyUpdate!: Company;

  genderOptions = [
    { value: 'male', label: 'Homme' },
    { value: 'female', label: 'Femme' }
  ];

  constructor() {
    if (history.state.isUpdateMode) {
      this.isUpdateMode = true;
      this.companyUpdate = history.state.company;
    }
  }

  ngOnInit(): void {
    this.initializeForms();
  }

  initializeForms(): void {
    // Formulaire utilisateur (propriétaire)
    this.userForm = this.fb.group({
      first_name: [
        this.isUpdateMode ? this.companyUpdate.owner.user.first_name : '',
        [Validators.required, Validators.maxLength(100)]
      ],
      last_name: [
        this.isUpdateMode ? this.companyUpdate.owner.user.last_name : '',
        [Validators.required, Validators.maxLength(100)]
      ],
      email: [
        this.isUpdateMode ? this.companyUpdate.owner.user.email : '',
        [Validators.required, Validators.email]
      ],
      phone_number_one: [
        this.isUpdateMode ? this.companyUpdate.owner.user.phone_number_one : '',
        [Validators.required, Validators.maxLength(20)]
      ],
      phone_number_two: [
        this.isUpdateMode ? this.companyUpdate.owner.user.phone_number_two : '',
        Validators.maxLength(20)
      ],
      address: [
        this.isUpdateMode ? this.companyUpdate.owner.user.address : '',
        Validators.maxLength(255)
      ],
      gender: [
        this.isUpdateMode ? this.companyUpdate.owner.user.gender : '',
        Validators.required
      ]
    });

    // Formulaire entreprise
    this.companyForm = this.fb.group({
      name: [
        this.isUpdateMode ? this.companyUpdate.name : '',
        [Validators.required, Validators.maxLength(255)]
      ],
      short_name: [
        this.isUpdateMode ? this.companyUpdate.short_name : '',
        Validators.maxLength(50)
      ],
      slogan: [
        this.isUpdateMode ? this.companyUpdate.slogan : '',
        Validators.maxLength(255)
      ],
      head_office_address: [
        this.isUpdateMode ? this.companyUpdate.head_office_address : '',
        Validators.maxLength(255)
      ],
      email_company: [
        this.isUpdateMode ? this.companyUpdate.email : '',
        [Validators.email]
      ],
      phone_one: [
        this.isUpdateMode ? this.companyUpdate.phone_one : '',
        [Validators.required, Validators.maxLength(20)]
      ],
      phone_two: [
        this.isUpdateMode ? this.companyUpdate.phone_two : '',
        Validators.maxLength(20)
      ]
    });
  }

  save(): void {
    this.isSubmitting = true;
    if (this.userForm.valid && this.companyForm.valid) {
      const formData = {
        ...this.userForm.value,
        ...this.companyForm.value
      };
      this.companyService.addCompany(formData).subscribe({
        next: (response) => {
          this.notify.success(response.message);
          this.goBack();
        },
        error: (error) => {
          console.log(error);
          if (error.error.errors?.email?.[0]) {
            this.errorMessage = error.error.errors.email[0];
            this.existErrorMessage = true;
            this.notify.error(this.errorMessage);
            this.isSubmitting = false;
          } else if (error.error.status == 400 || error.error.status == 429) {
            this.errorMessage = error.error.message;
            this.notify.error(this.errorMessage);
            this.existErrorMessage = true;
            this.isSubmitting = false;
          } else {
            this.errorMessage = error.error.message;
            this.existErrorMessage = true;
            this.notify.error(this.errorMessage);
            this.isSubmitting = false;
          }
        }
      });
    } else {
      this.isSubmitting = false;
      this.markFormGroupTouched(this.userForm);
      this.markFormGroupTouched(this.companyForm);
    }
  }

  edit(): void {
    this.isSubmitting = true;
    if (this.userForm.valid && this.companyForm.valid && this.isUpdateMode) {
      const formData = {
        ...this.userForm.value,
        ...this.companyForm.value
      };
      this.companyService
        .updateCompany(this.companyUpdate.id, formData)
        .subscribe({
          next: (response) => {
            this.notify.success(response.message);
            this.goBack();
          },
          error: (error) => {
            console.log(error);
            if (error.error.errors?.email?.[0]) {
              this.errorMessage = error.error.errors.email[0];
              this.existErrorMessage = true;
              this.notify.error(this.errorMessage);
              this.isSubmitting = false;
            } else if (error.error.status == 400 || error.error.status == 429) {
              this.errorMessage = error.error.message;
              this.notify.error(this.errorMessage);
              this.existErrorMessage = true;
              this.isSubmitting = false;
            } else {
              this.errorMessage = error.error.message;
              this.existErrorMessage = true;
              this.notify.error(this.errorMessage);
              this.isSubmitting = false;
            }
          }
        });
    } else {
      this.isSubmitting = false;
      this.markFormGroupTouched(this.userForm);
      this.markFormGroupTouched(this.companyForm);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
  goBack() {
    this.router.navigate(['/index/admin/company/list']);
  }
}
