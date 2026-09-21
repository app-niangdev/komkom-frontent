import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { NgIf } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { catchError, of } from 'rxjs';
import { EmailVerifyService } from './email-verify.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { KomkomPageLoaderComponent } from 'src/app/layouts/components/page-loader/page-loader.component';

@Component({
  selector: 'vex-email-verify',
  templateUrl: './email-verify.component.html',
  styleUrls: ['./email-verify.component.scss'],
  animations: [fadeInUp400ms],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTooltipModule,
    NgIf,
    MatIconModule,
    MatCheckboxModule,
    FormsModule,
    MatProgressBarModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    KomkomPageLoaderComponent
  ]
})
export class EmailVerifyComponent implements OnInit {
  message!: string;
  trueMessage: boolean = true;
  isError: boolean = true;
  response: any;
  isLoading: boolean = true;
  isVerified = false;
  error = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private emailVerifyService: EmailVerifyService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.verifyEmail();
  }

  private verifyEmail(): void {
    // Récupérer les paramètres de l'URL
    const id = parseInt(this.route.snapshot.paramMap.get('id')!);
    const hash = this.route.snapshot.paramMap.get('hash');
    const expires = this.route.snapshot.queryParamMap.get('expires');
    const signature = this.route.snapshot.queryParamMap.get('signature');

    if (!id || !hash || !expires || !signature) {
      this.error = 'Lien de vérification invalide.';
      this.isLoading = false;
      return;
    }

    // Appeler le service de vérification
    this.emailVerifyService.verify(id, hash, expires, signature).subscribe({
      next: (response: any) => {
        this.handleVerificationSuccess();
      },
      error: (err) => {
        this.handleVerificationError(err);
      }
    });
  }
  back() {
    // this.router.navigate(['/login']);
  }

  backToForgot() {
    this.router.navigate(['/forgot-password']);
  }

  private handleVerificationSuccess() {
    this.isVerified = true;
    this.isLoading = false;

    // return this.router.navigate(['/login']);
  }

  /**
   * Gère la réponse en cas d'erreur de vérification
   * @param err - L'erreur retournée par l'API
   */
  private handleVerificationError(err: any): void {
    this.error =
      err.error?.message || "Erreur lors de la vérification de l'email.";
    this.isLoading = false;
  }
}
