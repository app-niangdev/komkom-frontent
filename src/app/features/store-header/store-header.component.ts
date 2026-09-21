import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Location } from '@angular/common';
import { Company } from 'src/app/interfaces/Company';
import { Store } from 'src/app/interfaces/Store';

@Component({
  selector: 'vex-store-header',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './store-header.component.html',
  styleUrls: ['./store-header.component.scss']
})
export class StoreHeaderComponent implements OnInit {
  /**
   * Company (tenant) object — affiche le logo et le nom
   */
  @Input() company: Company | null = null;

  /**
   * Store (boutique) object — affiche les infos de la boutique
   */
  @Input() store: Store | null = null;

  /**
   * Sous-titre de la page (ex : "Gestion des produits", "Gestion des approvisionnements")
   */
  @Input() pageSubtitle: string = '';

  /**
   * Affiche ou masque le bouton Retour (défaut : true)
   */
  @Input() showBackButton: boolean = true;

  /**
   * Libellé du bouton retour (défaut : 'Retour')
   */
  @Input() backLabel: string = 'Retour';

  /**
   * Callback custom pour le retour — si non fourni, utilise Location.back()
   */
  @Input() onBack?: () => void;

  collapsed = false;

  constructor(private location: Location) {}

  ngOnInit(): void {
    this.collapsed = window.innerWidth < 768;
  }

  goBack(): void {
    if (this.onBack) {
      this.onBack();
    } else {
      this.location.back();
    }
  }

  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
  }

  get storeInfoItems() {
    if (!this.store) return [];
    const items = [];
    if (this.store.name) {
      items.push({
        icon: 'shopping_cart',
        label: this.store.name,
        type: 'name'
      });
    }
    if (this.store.address) {
      items.push({
        icon: 'location_on',
        label: this.store.address,
        type: 'address'
      });
    }
    if (this.store.email) {
      items.push({ icon: 'email', label: this.store.email, type: 'email' });
    }
    if (this.store.phone_one) {
      const phone = this.store.phone_two
        ? `${this.store.phone_one} / ${this.store.phone_two}`
        : this.store.phone_one;
      items.push({ icon: 'phone', label: phone, type: 'phone' });
    }
    return items;
  }
}
