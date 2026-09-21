import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface IpBlockedError {
  code: 'IP_BLOCKED';
  message: string;
  blocked_until: string;
  retry_after: number;
}

export interface IpBlockState {
  retryAfter: number;
  message: string;
}

/** « 01:40 » — format lisible d'un compte à rebours en secondes. */
export function formatCountdown(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const mm = m.toString().padStart(2, '0');
  const ss = s.toString().padStart(2, '0');

  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * Décompte local du blocage d'IP déclaré par le serveur. Le serveur reste
 * seul juge : ce service ne fait qu'afficher un compte à rebours, à zéro il
 * réouvre simplement le formulaire — une tentative peut toujours être
 * refusée si le blocage a été prolongé entre-temps.
 */
@Injectable({ providedIn: 'root' })
export class IpBlockService {
  private readonly stateSubject = new BehaviorSubject<IpBlockState | null>(null);
  readonly state$ = this.stateSubject.asObservable();

  private intervalId: ReturnType<typeof setInterval> | null = null;

  declare(erreur: IpBlockedError): void {
    this.stateSubject.next({
      retryAfter: erreur.retry_after,
      message: erreur.message
    });

    this.demarrerDecompte();
  }

  clear(): void {
    this.arreterDecompte();
    this.stateSubject.next(null);
  }

  private demarrerDecompte(): void {
    this.arreterDecompte();

    this.intervalId = setInterval(() => {
      const etat = this.stateSubject.getValue();
      if (!etat) {
        this.arreterDecompte();
        return;
      }

      const retryAfter = etat.retryAfter - 1;

      if (retryAfter <= 0) {
        this.arreterDecompte();
        this.stateSubject.next(null);
        return;
      }

      this.stateSubject.next({ ...etat, retryAfter });
    }, 1000);
  }

  private arreterDecompte(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
