import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgIf } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/Notification.service';
import { OtpStateService } from '../services/otp-state.service';

@Component({
  selector: 'vex-login-otp',
  templateUrl: './login-otp.component.html',
  styleUrls: ['./login-otp.component.scss'],
  animations: [fadeInUp400ms],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    NgIf,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    MatProgressSpinnerModule
  ]
})
export class LoginOtpComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private otpState = inject(OtpStateService);
  private cd = inject(ChangeDetectorRef);

  form!: FormGroup;
  isSubmitting = false;
  isResending = false;
  errorMessage = '';
  maskedEmailInfo = "Vérifiez votre boîte e-mail : un code vient de vous être envoyé.";

  private challengeToken = '';
  private rememberMe = false;

  ngOnInit(): void {
    const state = this.otpState.get();

    if (!state || !state.challengeToken) {
      // Rien à vérifier sans challenge actif : retour à la connexion.
      this.router.navigate(['/login']);
      return;
    }

    this.challengeToken = state.challengeToken;
    this.rememberMe = state.rememberMe;

    this.form = new FormGroup({
      code: new FormControl('', [
        Validators.required,
        Validators.pattern('^[0-9]{6}$')
      ])
    });
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting) return;

    this.isSubmitting = true;
    this.errorMessage = '';

    this.authService
      .verifyLoginOtp({
        challenge_token: this.challengeToken,
        code: this.form.value.code,
        remember_me: this.rememberMe
      })
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.otpState.clear();
          this.notificationService.success(response.message);
          this.router.navigate(['/index']);
        },
        error: (error: HttpErrorResponse) => {
          this.isSubmitting = false;
          this.errorMessage =
            error.error?.message ?? 'Code de vérification incorrect.';
          this.cd.markForCheck();
        }
      });
  }

  resend(): void {
    if (this.isResending) return;

    this.isResending = true;
    this.errorMessage = '';

    this.authService.resendLoginOtp(this.challengeToken).subscribe({
      next: (response) => {
        this.isResending = false;
        this.notificationService.success(response.message);
        this.cd.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.isResending = false;
        this.errorMessage = error.error?.message ?? "Impossible d'envoyer un nouveau code.";
        this.cd.markForCheck();
      }
    });
  }
}
