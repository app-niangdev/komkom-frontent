import { Injectable } from '@angular/core';

export interface LoginOtpState {
  challengeToken: string;
  expiresIn: number;
  rememberMe: boolean;
}

/**
 * Porte le challenge OTP entre l'écran de connexion et l'écran de
 * vérification, en mémoire seulement — jamais dans l'URL ni le stockage
 * local, pour ne pas laisser le jeton traîner.
 */
@Injectable({ providedIn: 'root' })
export class OtpStateService {
  private state: LoginOtpState | null = null;

  set(state: LoginOtpState): void {
    this.state = state;
  }

  get(): LoginOtpState | null {
    return this.state;
  }

  clear(): void {
    this.state = null;
  }
}
