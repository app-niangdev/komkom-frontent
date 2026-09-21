import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  OnInit
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { NgIf } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import Swal from 'sweetalert2';
import { NotificationService } from '../services/Notification.service';
import { HttpErrorResponse } from '@angular/common/http';
import { formatCountdown, IpBlockService } from '../services/ip-block.service';
import { OtpStateService } from '../services/otp-state.service';
import { AuthResponse } from 'src/app/response-type/Type';

@Component({
  selector: 'vex-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  animations: [fadeInUp400ms],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    NgIf,
    MatButtonModule,
    MatTooltipModule,
    MatIconModule,
    MatCheckboxModule,
    RouterLink,
    MatSnackBarModule,
    MatProgressBarModule,
    MatProgressSpinnerModule
  ]
})
export class LoginComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private cd = inject(ChangeDetectorRef);
  private blocage = inject(IpBlockService);
  private otpState = inject(OtpStateService);
  private destroyRef = inject(DestroyRef);
  form!: FormGroup;
  constructor() {}

  existErrorMessage: boolean = false;
  errorMessage!: string;
  isSubmitting: boolean = false;
  inputType = 'password';
  visible = false;

  /** Secondes restantes du blocage. Zéro quand l'accès est ouvert. */
  countdown = 0;
  blockMessage = '';

  ngOnInit() {
    this.form = new FormGroup({
      email: new FormControl('', [
        Validators.required,
        Validators.email,
        Validators.minLength(8),
        Validators.maxLength(50),
        Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')
      ]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(8)
      ]),
      rememberme: new FormControl(false)
    });

    // Le décompte est piloté par le service : un blocage rencontré sur un
    // autre écran est donc déjà connu en arrivant ici.
    this.blocage.state$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((etat) => {
        this.countdown = etat?.retryAfter ?? 0;
        this.blockMessage = etat?.message ?? '';
        this.cd.markForCheck();
      });
  }

  /** « 01:40 » — ce que lit l'utilisateur pendant l'attente. */
  get countdownLabel(): string {
    return formatCountdown(this.countdown);
  }

  get isBlocked(): boolean {
    return this.countdown > 0;
  }

  login() {
    if (this.form.invalid || this.isBlocked) return;

    this.isSubmitting = true;
    this.existErrorMessage = false;
    const credentials = this.form.value;

    this.authService.login(credentials).subscribe({
      next: (response: AuthResponse) => {
        this.isSubmitting = false;

        if (response.code === 'OTP_REQUIRED') {
          this.otpState.set({
            challengeToken: response.data?.challenge_token ?? '',
            expiresIn: response.data?.expires_in ?? 300,
            rememberMe: !!credentials.rememberme
          });
          this.notificationService.success(
            response.message ?? 'Un code de vérification a été envoyé.'
          );
          this.router.navigate(['/login-otp']);
          return;
        }

        this.blocage.clear();
        this.notificationService.success(response.message);
        this.redirectUserByRole();
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting = false;
        this.traiterErreur(error);
        this.cd.markForCheck();
      }
    });
  }

  /**
   * Le cas IP_BLOCKED n'est pas traité ici : l'intercepteur l'a déjà
   * déclaré au service de blocage, qui alimente le décompte affiché.
   */
  private traiterErreur(error: HttpErrorResponse): void {
    const corps = error.error;

    if (corps?.code === 'IP_BLOCKED' || error.status === 429) {
      this.existErrorMessage = false;
      return;
    }

    if (corps?.errors?.email?.[0]) {
      this.errorMessage = corps.errors.email[0];
      this.existErrorMessage = true;
      return;
    }

    if (corps?.isDisabled) {
      Swal.fire({
        title: 'Compte suspendu',
        text: "Votre compte a été suspendu. Veuillez contacter l'administrateur.",
        icon: 'warning',
        confirmButtonText: 'Compris',
        confirmButtonColor: '#f59e0b',
        allowOutsideClick: false,
        customClass: {
          container: 'swal2-container-custom',
          popup: 'swal2-popup-custom',
          confirmButton: 'swal2-confirm-custom'
        },
        heightAuto: false
      });
      return;
    }

    if (corps?.code === 'INVALID_CREDENTIALS') {
      const restants = corps.attempts_left;

      this.errorMessage =
        restants !== undefined && restants !== null && restants > 0 && restants <= 2
          ? `Email ou mot de passe incorrect. ${restants} tentative${restants > 1 ? 's' : ''} avant blocage temporaire.`
          : 'Email ou mot de passe incorrect';

      this.existErrorMessage = true;
      return;
    }

    this.errorMessage = corps?.message ?? 'Email ou mot de passe incorrect';
    this.existErrorMessage = true;
  }

  showSubscriptionRenewalAlert() {
    Swal.fire({
      title: "Renouvellement d'abonnement",
      html:
        'Merci de renouveler votre abonnement annuel avant le <b>10 Septembre 2026</b>.<br><br>' +
        '<div style="text-align:left">' +
        '<b>Détails :</b><br>' +
        'Serveur: ALFAYDA BUSINESS GROUP<br>' +
        'Depuis Septembre 2024<br>' +
        'Montant 250 000 Fcfa' +
        '</div>',
      icon: 'warning',
      confirmButtonText: 'Compris',
      confirmButtonColor: '#f59e0b',
      allowOutsideClick: false,
      customClass: {
        container: 'swal2-container-custom',
        popup: 'swal2-popup-custom',
        confirmButton: 'swal2-confirm-custom'
      },
      heightAuto: false
    });
  }

  redirectUserByRole() {
    this.authService.getUserAuth().subscribe({
      next: (response) => {
        const roleName = response.user?.role?.name?.toLowerCase();
        if (roleName === 'owner') {
          this.router.navigate(['/index/owner/stores']);
        } else if (roleName === 'manager' || roleName === 'seller') {
          this.router.navigate(['/index/manager/home']);
        } else {
          this.router.navigate(['/index/admin/company/list']);
        }
      },
      error: (err) => {
        console.error("Erreur lors de la récupération de l'utilisateur", err);
      }
    });
  }

  goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }

  toggleVisibility() {
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
