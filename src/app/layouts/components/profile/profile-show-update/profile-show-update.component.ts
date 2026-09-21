import { NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { fadeInRight400ms } from '@vex/animations/fade-in-right.animation';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { scaleIn400ms } from '@vex/animations/scale-in.animation';
import { stagger40ms } from '@vex/animations/stagger.animation';
import { AuthService } from 'src/app/auth/services/auth.service';
import { CurrentUserAuth } from 'src/app/response-type/Type';
import { UploadFileComponent } from '../../upload-file/upload-file.component';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { User } from 'src/app/interfaces/User';
import { NotificationService } from 'src/app/auth/services/Notification.service';
import { UserService } from 'src/app/auth/services/user.service';

@Component({
  selector: 'vex-profile-show-update',
  templateUrl: './profile-show-update.component.html',
  styleUrls: ['./profile-show-update.component.scss'],
  standalone: true,
  imports: [
    MatIconModule,
    NgIf,
    MatButtonModule,
    MatTooltipModule,
    UploadFileComponent,
    ReactiveFormsModule
  ],
  animations: [fadeInUp400ms, fadeInRight400ms, scaleIn400ms, stagger40ms]
})
export class ProfileShowUpdateComponent {
  userConnet: CurrentUserAuth | null = null;
  isUpdateMode: boolean = false;
  form!: FormGroup;
  selectedFile: File | null = null;

  isSubmitting: boolean = false;
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private fb: FormBuilder,
    private notif: NotificationService
  ) {}

  ngOnInit() {
    // Charger les données initiales
    this.authService.getUserAuth().subscribe({
      next: (response) => {
        this.userConnet = response;
        this.initializeForm(this.userConnet.user);
      }
    });

    // S'abonner aux mises à jour en temps réel
    this.authService.getCurrentUserAuth().subscribe({
      next: (response) => {
        if (response) {
          this.userConnet = response;
          if (this.form) {
            this.initializeForm(response.user);
          }
        }
      }
    });
  }

  getRoleName(name: string) {
    let roleName = '';
    switch (name) {
      case 'Owner':
        roleName = 'Propriétaire';
        break;
      case 'Seller':
        roleName = 'Vendeur';
        break;
      case 'Manager':
        roleName = 'Directeur';
        break;
      default:
        break;
        return roleName;
    }
  }

  onFileUpload(file: File): void {
    this.selectedFile = file;
    this.form.patchValue({ image_url: file });
  }

  onFileRemove(): void {
    this.selectedFile = null;
    this.form.patchValue({ image_url: null });
  }
  showForm() {
    this.isUpdateMode = !this.isUpdateMode;
  }

  translateRoleName(role: string): string {
    switch (role) {
      case 'Owner':
        return 'Propriétaire';
      case 'Seller':
        return 'Vendeur';
      case 'Manager':
        return 'Manager';
      default:
        return role;
    }
  }

  initializeForm(user: User): void {
    this.form = this.fb.group({
      first_name: [
        user.first_name,
        [
          Validators.required,
          Validators.minLength(4),
          Validators.maxLength(255)
        ]
      ],
      last_name: [
        user.last_name,
        [Validators.minLength(2), Validators.maxLength(50)]
      ],
      address: [
        user.address,
        [Validators.minLength(2), Validators.maxLength(255)]
      ],
      gender: [user.gender, [Validators.required, Validators.maxLength(255)]],
      phone_number_one: [
        user.phone_number_one,
        [Validators.required, Validators.minLength(9), Validators.maxLength(20)]
      ],
      phone_number_two: [
        user.phone_number_two,
        [Validators.minLength(9), Validators.maxLength(20)]
      ],
      image_url: [null]
    });
  }

  save() {
    if (!this.form.valid || !this.userConnet || !this.isUpdateMode) return;
    this.isSubmitting = true;
    this.form.disable();
    const formData = this.createFormData();
    this.userService
      .updateUserProfile(this.userConnet.user.id, formData)
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.notif.success(response.message);
          this.showForm();
          // Rafraîchir les données utilisateur dans tous les composants
          this.authService.refreshUserAuth().subscribe({
            next: () => {
              this.form.enable();
            }
          });
        },
        error: (error) => {
          console.log(error);
          this.isSubmitting = false;
          this.form.enable();
          this.notif.error(error.message);
        }
      });
  }

  private createFormData(): FormData {
    const formData = new FormData();
    formData.append('_method', 'PUT');
    const formFields = {
      first_name: this.form.get('first_name')?.value,
      last_name: this.form.get('last_name')?.value,
      email: this.userConnet?.user.email,
      phone_number_one: this.form.get('phone_number_one')?.value,
      phone_number_two: this.form.get('phone_number_two')?.value,
      gender: this.form.get('gender')?.value,
      address: this.form.get('address')?.value,
      role_id: this.userConnet?.user.role_id,
      store_id: this.userConnet?.store?.id
    };
    // Ajouter tous les champs au FormData
    Object.entries(formFields).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });

    // Ajouter le fichier s'il existe
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    return formData;
  }
}
