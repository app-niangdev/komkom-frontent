import { NgIf, NgFor, DatePipe } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
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
import { AuthService } from 'src/app/auth/services/auth.service';
import { NotificationService } from 'src/app/auth/services/Notification.service';
import { UserService } from 'src/app/auth/services/user.service';
import { Role } from 'src/app/interfaces/Role';
import { Store } from 'src/app/interfaces/Store';
import { User } from 'src/app/interfaces/User';

@Component({
  selector: 'vex-company-user-add-update',
  templateUrl: './company-user-add-update.component.html',
  styleUrls: ['./company-user-add-update.component.scss'],
  animations: [stagger80ms, scaleIn400ms, fadeInRight400ms, fadeInUp400ms],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    NgIf,
    NgFor,
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
  providers:[DatePipe]
})
export class CompanyUserAddUpdateComponent implements OnInit {
    form!: FormGroup;
    selectedFile: File | null = null;
    imageUrl: string='' ;
    messageCtrlImg: string='' ;
    mainFrameLoading:boolean= false;
    isFailedImg:boolean= false;
    isEditMode:boolean= false;
    userSelected!:User;
    roles : Role[] = [];
    stores : Store[] = [];
    isSubmitting:boolean=false;

    constructor(private fb: FormBuilder,
      @Inject(MAT_DIALOG_DATA) public data: any,
      public dialogRef: MatDialogRef<CompanyUserAddUpdateComponent>,
      private userService: UserService,
      private authService: AuthService,
      private notif: NotificationService,
      private router:Router
    ) {

      this.isEditMode = data.isEditMode;
      this.userSelected = data.user || {};
    }

    ngOnInit(): void {
      this.getRoles();
      this.authService.getUserAuth().subscribe({
        next: (response) => {
          this.stores = response.stores;
        }
      });

      this.form = this.fb.group({
        first_name: [this.userSelected.first_name || '', [Validators.required, Validators.minLength(2), Validators.maxLength(254)]],
        last_name: [this.userSelected.last_name || '', [Validators.required, Validators.minLength(2), Validators.maxLength(254)]],
        email: [this.userSelected.email || '', [Validators.required, Validators.minLength(8), Validators.maxLength(254),
          Validators.email, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')]],
        profile_photo_path: null,
        phone_number_one: [this.userSelected.phone_number_one || '',[Validators.required, Validators.minLength(9), Validators.pattern('^[0-9]*$'), Validators.maxLength(9)]],
        phone_number_two: [this.userSelected.phone_number_two || '',[Validators.minLength(9), Validators.pattern('^[0-9]*$'), Validators.maxLength(9)]],
        status: [this.userSelected.status || 'actif'],
        address: [this.userSelected.address || '', [Validators.required, Validators.minLength(2), Validators.maxLength(254)]],
        gender: [this.userSelected.gender || '', [Validators.required]],
        role_id: [this.userSelected.role_id || '', [Validators.required]],
        store_id: [
          this.userSelected.seller?.store_id ?? this.userSelected.manager?.store_id ?? null,
          [Validators.required]
        ],
      });

    }

    getRoles(){
      this.userService.getRoles().subscribe({
        next:(response)=>{
          this.roles = response.data;
        }
      })
    }

  save() {
    if (!this.form.valid) return;
    this.isSubmitting = true;
    const isEdit = this.isEditMode && !!this.userSelected;
    const formData = this.form.value;

    const request$ = isEdit
      ? this.userService.updateUser(this.userSelected.id, formData)
      : this.userService.addUser(formData);

    request$.subscribe({
      next: (response) => {
        this.handleSuccess(response);
        this.isSubmitting = false;
      },
      error: (error) => {
        this.handleError();
        this.isSubmitting = false;
      }
    });
  }

    updateUser() {
      if (!this.form.valid || !this.userSelected || !this.isEditMode) return;

      this.mainFrameLoading = true;
      this.form.disable();

      const formData = this.form.value;

      this.userService.updateUser(this.userSelected.id, formData).subscribe({
        next: (response) => {
          this.handleSuccess(response);
        },
        error: (error) => {
          this.handleError();
        }
      });
    }

    private createFormData(isUpdate: boolean = false): FormData {
      const formData = new FormData();

      if (isUpdate) {
        formData.append('_method', 'PUT');
      }

      const formFields = {
        'first_name': this.form.get('first_name')?.value,
        'last_name': this.form.get('last_name')?.value,
        'email': this.form.get('email')?.value,
        'role_id': this.form.get('role_id')?.value,
      };
      // Ajouter tous les champs au FormData
      Object.entries(formFields).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      // Ajouter le fichier s'il existe
      if (this.selectedFile) {
        formData.append('profile_photo_path', this.selectedFile);
      }

      return formData;
    }

    roleLabel(role:string){
      switch (role) {
        case 'Manager':
          return'Directeur';
          break;
        case 'Seller':
          return'Vendeur';
          break;
        case 'Owner':
          return'Proprietaire';
          break;

        default:
          return role
          break;
      }
    }
    private handleSuccess(response: any) {
      this.notif.success(response.message);
      this.mainFrameLoading = false;
      this.form.enable();
      this.close();
    }

    private handleError() {
      this.mainFrameLoading = false;
      this.form.enable();
    }

    close(): void {
      this.dialogRef.close(true);
    }
}
