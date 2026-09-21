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
import { VexPageLayoutComponent } from '@vex/components/vex-page-layout/vex-page-layout.component';
import { AuthService } from 'src/app/auth/services/auth.service';
import { Store } from 'src/app/interfaces/Store';
import { CurrentUserAuth } from 'src/app/response-type/Type';
import { CompanyStoreAddComponent } from '../../admin/company/company-store-add/company-store-add.component';
import { MatDialog } from '@angular/material/dialog';
import { Company } from 'src/app/interfaces/Company';
import { StoreHeaderComponent } from '../../store-header/store-header.component';

@Component({
  selector: 'vex-company-home',
  templateUrl: './company-home.component.html',
  styleUrls: ['./company-home.component.scss'],
  animations: [scaleIn400ms, fadeInRight400ms],
  standalone: true,
  imports: [
    NgIf,
    MatTabsModule,
    NgFor,
    MatMenuModule,
    MatIconModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    StoreHeaderComponent
  ]
})
export class CompanyHomeComponent {
  userConnet: CurrentUserAuth | null = null;
  company: Company | null = null;
  stores: Store[] = [];
  constructor(
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.initData();
  }

  initData(refresh: boolean = false) {
    const request = refresh
      ? this.authService.refreshUserAuth()
      : this.authService.getUserAuth();

    request.subscribe({
      next: (response) => {
        this.userConnet = response;
        this.company = response.company;
        this.stores = response.stores;
      }
    });
  }

  getStoreCode(store: Store): string {
    const initials = store.name
      .split(/\s+/)
      .filter((word) => word.length > 0)
      .map((word) => word[0].toUpperCase())
      .join('');

    return `${initials}-${store.id}`;
  }

  goToStore(store: Store) {
    this.router.navigate(['/index/owner/store'], {
      state: { store: store, company: this.userConnet?.company }
    });
  }

  editStore(store: Store) {
    const dialogRef = this.dialog.open(CompanyStoreAddComponent, {
      width: '800px',
      disableClose: true,
      data: {
        isUpdateMode: true,
        title: 'Modifier la boutique',
        company: this.userConnet?.company,
        store: store
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.initData(true);
      }
    });
  }
}
