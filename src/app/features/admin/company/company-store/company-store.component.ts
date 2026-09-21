import { A11yModule } from '@angular/cdk/a11y';
import { NgIf, NgFor, CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  ReactiveFormsModule,
  FormsModule,
  UntypedFormControl,
  FormBuilder
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { fadeInRight400ms } from '@vex/animations/fade-in-right.animation';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { scaleIn400ms } from '@vex/animations/scale-in.animation';
import { stagger80ms } from '@vex/animations/stagger.animation';
import { VexPageLayoutContentDirective } from '@vex/components/vex-page-layout/vex-page-layout-content.directive';
import {
  ReplaySubject,
  Observable,
  debounceTime,
  distinctUntilChanged,
  switchMap
} from 'rxjs';
import { CompanyService } from 'src/app/auth/services/company.service';
import { NotificationService } from 'src/app/auth/services/Notification.service';
import { Company, CompanyResponse } from 'src/app/interfaces/Company';
import { Store, StoreResponse } from 'src/app/interfaces/Store';
import {
  PaginationMeta,
  initialPaginationMeta
} from 'src/app/response-type/Type';
import { CompanyStoreAddComponent } from '../company-store-add/company-store-add.component';
import Swal from 'sweetalert2';
import { User } from 'src/app/interfaces/User';
import { AuthService } from 'src/app/auth/services/auth.service';

@Component({
  selector: 'vex-company-store',
  templateUrl: './company-store.component.html',
  styleUrls: ['./company-store.component.scss'],
  animations: [stagger80ms, fadeInUp400ms, scaleIn400ms, fadeInRight400ms],
  standalone: true,
  imports: [
    MatButtonToggleModule,
    ReactiveFormsModule,
    VexPageLayoutContentDirective,
    NgIf,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTableModule,
    MatSortModule,
    MatSelectModule,
    MatOptionModule,
    MatCheckboxModule,
    NgFor,
    MatPaginatorModule,
    FormsModule,
    MatDialogModule,
    MatInputModule,
    MatSnackBarModule,
    CommonModule,
    MatSlideToggleModule,
    MatDividerModule,
    A11yModule,
    MatTooltipModule
  ]
})
export class CompanyStoreComponent {
  searchCtrl = new UntypedFormControl();
  layoutCtrl = new UntypedFormControl('boxed');
  private companyService = inject(CompanyService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  subject$: ReplaySubject<Company[]> = new ReplaySubject<Company[]>(1);
  data$: Observable<CompanyResponse> = new Observable<CompanyResponse>();
  searchTerm: string = '';
  isLoading: boolean = false;
  company!: Company;
  message: string = '';
  meta: PaginationMeta = { ...initialPaginationMeta };
  stores: Store[] = [];
  hasAdminAuthority: boolean = false;
  user: User | null = null;

  constructor() {
    if (!history.state.company) {
      this.goBack();
    }
    this.company = history.state.company;
    this.loadStores();
    this.searchCtrl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((searchTerm) =>
          this.companyService.getStoresCompany(
            this.company.id,
            searchTerm,
            1,
            10,
            ''
          )
        )
      )
      .subscribe((response) => {
        this.assigneData(response);
      });
  }
  ngOnInit(): void {
    this.user = this.authService.getCurrentUserSync();
    if (this.user?.role.name == 'Admin') {
      this.hasAdminAuthority = true;
    }
    this.loadStores();
  }

  goBack() {
    this.router.navigate(['/index/admin/company/list']);
  }

  createStore() {
    const dialogRef = this.dialog.open(CompanyStoreAddComponent, {
      width: '800px',
      disableClose: true,
      data: {
        isUpdateMode: false,
        title: 'Nouvelle',
        company: this.company
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadStores();
      }
    });
  }

  goToStore(store: Store) {
    this.router.navigate(['/index/owner/store'], {
      state: { store: store, company: this.company }
    });
  }

  updateStore(store: Store) {
    const dialogRef = this.dialog.open(CompanyStoreAddComponent, {
      width: '800px',
      disableClose: true,
      data: {
        isUpdateMode: true,
        title: 'Modifier une boutique',
        company: this.company,
        store: store
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadStores();
      }
    });
  }

  loadStores() {
    this.companyService
      .getStoresCompany(
        this.company.id,
        '',
        this.meta.current_page,
        this.meta.per_page,
        ''
      )
      .subscribe({
        next: (response) => {
          this.assigneData(response);
        }
      });
  }

  assigneData(data: StoreResponse) {
    this.stores = data.data;
    this.meta = data.meta;
  }

  pageEvent($event: PageEvent) {}

  delete(store: Store) {
    Swal.fire({
      title: 'Confirmation',
      text: `Voulez-vous vraiment supprimer la boutique "${store.name}" ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Suppression en cours...',
          text: 'Veuillez patienter',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        // this.companyService.delete(store.id).subscribe({
        //   next: (response) => {
        //     Swal.fire({
        //       icon: 'success',
        //       title: 'Supprimé !',
        //       text: response.message || 'La boutique a été supprimée avec succès.',
        //       timer: 2000,
        //       showConfirmButton: false
        //     });
        //     this.loadStores();
        //   },
        //   error: (error) => {
        //     Swal.fire({
        //       icon: 'error',
        //       title: 'Erreur',
        //       text: error?.message || 'Une erreur est survenue lors de la suppression.',
        //       confirmButtonColor: '#d33'
        //     });
        //   }
        // });
      }
    });
  }

  changeStatus(store: Store) {
    const action = store.active ? 'désactiver' : 'activer';
    // const confirmButtonColor = store.active ? '#d33' : '#3085d6';

    Swal.fire({
      title: 'Confirmation',
      text: `Voulez-vous vraiment ${action} cette boutique ?`,
      icon: 'warning',
      showCancelButton: true,
      // confirmButtonColor,
      cancelButtonColor: '#6c757d',
      confirmButtonText: `Oui, ${action}`,
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.companyService.changeStatus(store.id).subscribe({
          next: (response) => {
            Swal.fire({
              icon: 'success',
              title: 'Succès',
              text: response.message,
              timer: 2000,
              showConfirmButton: false
            });
            this.loadStores();
          },
          error: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: error?.message || 'Une erreur est survenue.',
              confirmButtonColor: '#d33'
            });
            this.loadStores();
          }
        });
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return '??';

    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
}
