import { NgFor, NgIf } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { fadeInRight400ms } from '@vex/animations/fade-in-right.animation';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { scaleIn400ms } from '@vex/animations/scale-in.animation';
import { stagger40ms, stagger60ms } from '@vex/animations/stagger.animation';
import { AuthService } from 'src/app/auth/services/auth.service';
import { NotificationService } from 'src/app/auth/services/Notification.service';
import { User } from 'src/app/interfaces/User';

@Component({
  selector: 'vex-profile-security',
  templateUrl: './profile-security.component.html',
  styleUrls: ['./profile-security.component.scss'],
  animations: [stagger60ms, fadeInUp400ms],
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    NgIf,
    ReactiveFormsModule,
  ]
})
export class ProfileSecurityComponent {
  inputType = 'password';
  visible = false;
  passwordForm: FormGroup;
  user:User | null = null;
  isSubmitting:boolean = false;
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private cd: ChangeDetectorRef,
    private notif: NotificationService,
  ) {
    this.passwordForm = this.fb.group(
    {
      current_password: ['', [Validators.required, Validators.maxLength(8), Validators.minLength(8)]],
      new_password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(8)]],
      new_password_confirmation: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(8)]],
    },
    {
      validators: [this.passwordMatchValidator]
    });

    authService.getCurrentUser().subscribe({
      next:(response)=>{
        this.user = response
      }
    })
  }

    passwordMatchValidator: ValidatorFn = (form: AbstractControl): ValidationErrors | null => {
    const newPassword = form.get('new_password')?.value;
    const confirmPassword = form.get('new_password_confirmation')?.value;

    return newPassword !== confirmPassword ? { passwordMismatch: true } : null;
  };

  changePassword(){
    if (this.passwordForm.valid && this.user?.id) {
      this.authService.changePassword(this.user.id, this.passwordForm.value).subscribe({
        next:(response)=>{
          this.notif.success(response.message);
          this.authService.logout().subscribe({
            next: () => {
              this.router.navigate(['/login']);
            },
            error: (logoutError) => {
              this.router.navigate(['/login']);
            }
          });
        },
        error:(error)=>{
          if (error.error.error) {
            this.notif.error(error.error.message);
          }
          this.notif.error(error.error.ErrorList.new_password[0]);
        }
      })

    }
  }
    togglePassword() {
    if (this.visible) {
      this.inputType = 'password';
      this.visible = false;
      this.cd.markForCheck();
    } else {
      this.inputType = 'text';
      this.visible = true;
      this.cd.markForCheck();
    }
  }
}
