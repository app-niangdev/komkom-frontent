import { Component, Input, OnInit } from '@angular/core';
import { NavigationService } from '../../../core/navigation/navigation.service';
import { VexLayoutService } from '@vex/services/vex-layout.service';
import { VexConfigService } from '@vex/config/vex-config.service';
import { map, startWith, switchMap } from 'rxjs/operators';
import { NavigationItem } from '../../../core/navigation/navigation-item.interface';
import { VexPopoverService } from '@vex/components/vex-popover/vex-popover.service';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { SidenavUserMenuComponent } from './sidenav-user-menu/sidenav-user-menu.component';
import { MatDialog } from '@angular/material/dialog';
import { SearchModalComponent } from './search-modal/search-modal.component';
import { SidenavItemComponent } from './sidenav-item/sidenav-item.component';
import { VexScrollbarComponent } from '@vex/components/vex-scrollbar/vex-scrollbar.component';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { CurrentUserAuth } from 'src/app/response-type/Type';
import { AuthService } from 'src/app/auth/services/auth.service';
import { Company } from 'src/app/interfaces/Company';

@Component({
  selector: 'vex-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    MatButtonModule,
    MatIconModule,
    MatRippleModule,
    VexScrollbarComponent,
    NgFor,
    SidenavItemComponent,
    AsyncPipe
  ]
})
export class SidenavComponent implements OnInit {
  company!: Company;
  @Input() collapsed: boolean = false;
  collapsedOpen$ = this.layoutService.sidenavCollapsedOpen$;

  private titleSubject$ = new BehaviorSubject<string>('');
  title$: Observable<string> = this.titleSubject$.asObservable();

  private imageUrlSubject$ = new BehaviorSubject<string>('');
  imageUrl$: Observable<string> = this.imageUrlSubject$.asObservable();

  showCollapsePin$ = this.configService.config$.pipe(
    map((config) => config.sidenav.showCollapsePin)
  );
  userVisible$ = this.configService.config$.pipe(
    map((config) => config.sidenav.user.visible)
  );
  searchVisible$ = this.configService.config$.pipe(
    map((config) => config.sidenav.search.visible)
  );

  userMenuOpen$: Observable<boolean> = of(false);

  items$: Observable<NavigationItem[]> = this.navigationService.items$;
  userConnet: CurrentUserAuth | null = null;
  constructor(
    private navigationService: NavigationService,
    private layoutService: VexLayoutService,
    private configService: VexConfigService,
    private readonly popoverService: VexPopoverService,
    private readonly dialog: MatDialog,
    private readonly authService: AuthService
  ) {}

  ngOnInit() {
    this.configService.config$
      .pipe(
        map((config) => ({
          title: config.sidenav.title,
          imageUrl: config.sidenav.imageUrl
        }))
      )
      .subscribe(({ title, imageUrl }) => {
        this.titleSubject$.next(title);
        this.imageUrlSubject$.next(imageUrl);
      });

    // Charger les données initiales
    this.authService.getUserAuth().subscribe({
      next: (response) => {
        this.userConnet = response;
        this.company = response.company;

        if (this.company?.short_name) {
          this.titleSubject$.next(this.company.short_name);
        }

        if (this.company?.logo_url) {
          this.imageUrlSubject$.next(this.company.logo_url);
        }
      }
    });

    // S'abonner aux mises à jour en temps réel de la company
    this.authService.getCurrentCompany().subscribe({
      next: (company) => {
        if (company) {
          if (company.short_name) {
            this.titleSubject$.next(company.short_name);
          }

          if (company.logo_url) {
            this.imageUrlSubject$.next(company.logo_url);
          }
        }
      }
    });

    // S'abonner aux mises à jour de CurrentUserAuth
    this.authService.getCurrentUserAuth().subscribe({
      next: (response) => {
        if (response) {
          this.userConnet = response;
          this.company = response.company;
        }
      }
    });
  }

  collapseOpenSidenav() {
    this.layoutService.collapseOpenSidenav();
  }

  collapseCloseSidenav() {
    this.layoutService.collapseCloseSidenav();
  }

  toggleCollapse() {
    this.collapsed
      ? this.layoutService.expandSidenav()
      : this.layoutService.collapseSidenav();
  }

  trackByRoute(index: number, item: NavigationItem): string {
    if (item.type === 'link') {
      return item.route;
    }

    return item.label;
  }

  openProfileMenu(origin: HTMLDivElement): void {
    this.userMenuOpen$ = of(
      this.popoverService.open({
        content: SidenavUserMenuComponent,
        origin,
        offsetY: -8,
        width: origin.clientWidth,
        position: [
          {
            originX: 'center',
            originY: 'top',
            overlayX: 'center',
            overlayY: 'bottom'
          }
        ]
      })
    ).pipe(
      switchMap((popoverRef) => popoverRef.afterClosed$.pipe(map(() => false))),
      startWith(true)
    );
  }

  openSearch(): void {
    this.dialog.open(SearchModalComponent, {
      panelClass: 'vex-dialog-glossy',
      width: '100%',
      maxWidth: '600px'
    });
  }

  getRoleName(name: string) {
    let roleName = '';
    switch (name) {
      case 'Owner':
        roleName = 'Propriétaire';
        break;
      case 'Seller':
        roleName = 'Vendeur';
        break;
      case 'Manager':
        roleName = 'Directeur';
        break;
      default:
        break;
        return roleName;
    }
  }
}
