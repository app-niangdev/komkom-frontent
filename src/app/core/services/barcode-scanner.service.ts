import { Injectable, NgZone } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Capture les scans d'un lecteur code-barres USB (mode clavier).
 * Les lecteurs envoient les caractères rapidement puis Entrée.
 */
@Injectable({ providedIn: 'root' })
export class BarcodeScannerService {
  private readonly scanSubject = new Subject<string>();
  readonly scan$ = this.scanSubject.asObservable();

  private enabled = false;
  private buffer = '';
  private lastKeyTime = 0;
  private readonly interKeyThresholdMs = 100;
  private readonly minBarcodeLength = 2;

  private readonly boundKeyDown = this.onKeyDown.bind(this);

  constructor(private ngZone: NgZone) {}

  enable(): void {
    if (this.enabled) return;
    this.enabled = true;
    document.addEventListener('keydown', this.boundKeyDown, true);
  }

  disable(): void {
    if (!this.enabled) return;
    this.enabled = false;
    document.removeEventListener('keydown', this.boundKeyDown, true);
    this.buffer = '';
  }

  /** Émet un scan depuis un champ dédié (saisie + Entrée). */
  emitScan(code: string): void {
    const trimmed = code.trim();
    if (trimmed.length >= this.minBarcodeLength) {
      this.scanSubject.next(trimmed);
    }
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (!this.enabled) return;

    const target = event.target as HTMLElement | null;
    // Champ dédié : géré par (keydown.enter) du composant
    if (target?.hasAttribute('data-barcode-scan')) {
      return;
    }
    if (target && this.isEditableTarget(target)) {
      return;
    }

    const now = Date.now();
    if (now - this.lastKeyTime > this.interKeyThresholdMs) {
      this.buffer = '';
    }
    this.lastKeyTime = now;

    if (event.key === 'Enter') {
      const code = this.buffer.trim();
      this.buffer = '';
      if (code.length >= this.minBarcodeLength) {
        event.preventDefault();
        event.stopPropagation();
        this.ngZone.run(() => this.scanSubject.next(code));
      }
      return;
    }

    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      this.buffer += event.key;
    }
  }

  private isEditableTarget(el: HTMLElement): boolean {
    const tag = el.tagName.toLowerCase();
    return (
      tag === 'input' ||
      tag === 'textarea' ||
      tag === 'select' ||
      el.isContentEditable
    );
  }
}
