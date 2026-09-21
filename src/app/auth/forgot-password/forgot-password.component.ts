import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { MatButtonModule } from '@angular/material/button';
import { NgIf } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AuthService } from '../services/auth.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoginError } from '../ErrorResponse';

@Component({
  selector: 'vex-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  animations: [fadeInUp400ms],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    NgIf,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ]
})
export class ForgotPasswordComponent implements OnInit {
  mainFrameLoading:boolean= false;
  isSubmitting:boolean = false;
  email:string='';
  showSuccess:boolean=false;
  messageSuccess:string='';

  form = this.fb.group({
      email: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(50),
      Validators.email, Validators.email, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')]],
  });

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {}

  send() {
    if (this.form.valid && this.form.value) {
      this.isSubmitting = true;
      this.form.disable();
      if (this.form.value.email) {
        this.email= this.form.value.email
      }

      this.authService.forgotPassword(this.email)
        .subscribe({
          next: (response) => {
            this.isSubmitting = false;
            this.showMessage(response.message);
            this.showSuccess = true;
            this.messageSuccess = response.message;
          },
          error: (error:LoginError) => {
            console.log(error);
            this.showSuccess = true;
            this.showMessage(error.error.message);
            this.messageSuccess = error.error.message;
            this.isSubmitting = false;
            this.form.enable();
          }
      });
    }
  }

  goToLogin(){
    this.router.navigate(['/']);
  }

  showMessage(message:string){
    this.snackBar.open(
    message,
    'MERCI',
    {
      duration: 50000
    }
  );
  }


}
