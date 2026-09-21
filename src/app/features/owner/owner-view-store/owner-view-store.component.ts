import { NgIf, NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { fadeInRight400ms } from '@vex/animations/fade-in-right.animation';
import { scaleIn400ms } from '@vex/animations/scale-in.animation';
import {
  NavigationDropdown,
  NavigationItem,
  NavigationLink,
  NavigationSubheading
} from 'src/app/core/navigation/navigation-item.interface';
import { NavigationLoaderService } from 'src/app/core/navigation/navigation-loader.service';
import { Company } from 'src/app/interfaces/Company';
import { Store } from 'src/app/interfaces/Store';
import { Location } from '@angular/common';
import { StoreHeaderComponent } from '../../store-header/store-header.component';
@Component({
  selector: 'vex-owner-view-store',
  templateUrl: './owner-view-store.component.html',
  styleUrls: ['./owner-view-store.component.scss'],
  animations: [scaleIn400ms, fadeInRight400ms],
  standalone: true,
  imports: [
    NgIf,
    MatTabsModule,
    NgFor,
    MatMenuModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    StoreHeaderComponent
  ]
})
export class OwnerViewStoreComponent {
  store!: Store;
  company: Company | null = null;
  managerNavigationItems: NavigationItem[] = [];
  managerNavigationLinks: any[] = [];

  constructor(
    private router: Router,
    private location: Location,
    private navigationLoaderService: NavigationLoaderService
  ) {
    if (history.state.store && history.state.company) {
      this.store = history.state.store;
      this.company = history.state.company;
      this.loadManagerNavigation();
    } else {
      this.goBack();
    }
  }

  loadManagerNavigation(): void {
    this.managerNavigationItems =
      this.navigationLoaderService.getNavigationForRole('Manager');
    this.managerNavigationLinks = this.extractAllLinks(
      this.managerNavigationItems
    );
  }

  // Méthode pour extraire tous les liens de la navigation
  private extractAllLinks(navigationItems: NavigationItem[]): any[] {
    const links: any[] = [];

    navigationItems.forEach((item) => {
      // Vérifier le type de l'item
      if (this.isNavigationSubheading(item) && item.children) {
        // Pour les subheadings, parcourir leurs enfants
        item.children.forEach((child) => {
          if (this.isNavigationLink(child)) {
            links.push({
              label: child.label,
              route: child.route,
              icon: child.icon,
              section: item.label
            });
          } else if (this.isNavigationDropdown(child) && child.children) {
            // Pour les dropdowns, parcourir leurs enfants
            child.children.forEach((dropdownChild) => {
              if (this.isNavigationLink(dropdownChild)) {
                links.push({
                  label: dropdownChild.label,
                  route: dropdownChild.route,
                  icon: child.icon, // Utilise l'icône du dropdown parent
                  section: item.label,
                  isDropdown: true
                });
              }
            });
          }
        });
      }
    });
    return links;
  }

  getInitials(fullName: string): string {
    if (!fullName) return '';
    return fullName
      .split(' ')
      .map((n) => n.charAt(0))
      .join('');
  }

  // Guards de type pour NavigationItem
  private isNavigationLink(item: NavigationItem): item is NavigationLink {
    return item.type === 'link';
  }

  private isNavigationDropdown(
    item: NavigationItem
  ): item is NavigationDropdown {
    return item.type === 'dropdown';
  }

  private isNavigationSubheading(
    item: NavigationItem
  ): item is NavigationSubheading {
    return item.type === 'subheading';
  }

  goBack = () => {
    this.router.navigate(['/index/owner/stores']);
  };

  // Méthode pour naviguer vers une route
  navigateTo(route: string): void {
    this.router.navigate([route], {
      state: { store: this.store, company: this.company }
    });
  }

  // Méthode pour grouper les liens par section
  getLinksBySection(): { [key: string]: any[] } {
    const grouped: { [key: string]: any[] } = {};

    this.managerNavigationLinks.forEach((link) => {
      if (!grouped[link.section]) {
        grouped[link.section] = [];
      }
      grouped[link.section].push(link);
    });

    return grouped;
  }

  // Méthode pour obtenir les sections uniques
  getSections(): string[] {
    const sections = this.managerNavigationLinks.map((link) => link.section);
    return [...new Set(sections)]; // Retourne les sections uniques
  }

  // Méthode pour obtenir les liens d'une section spécifique
  getLinksForSection(section: string): any[] {
    return this.managerNavigationLinks.filter(
      (link) => link.section === section
    );
  }
}
