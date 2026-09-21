import {
  Component,
  DestroyRef,
  inject,
  Input,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormControl
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  Observable,
  ReplaySubject,
  switchMap
} from 'rxjs';
import { AuthService } from 'src/app/auth/services/auth.service';
import { UserService } from 'src/app/auth/services/user.service';
import { User } from 'src/app/interfaces/User';
import {
  initialPaginationMeta,
  PaginationMeta,
  ResponseUser
} from 'src/app/response-type/Type';
import { CompanyUserAddUpdateComponent } from '../company-user-add-update/company-user-add-update.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent
} from '@angular/material/paginator';
import { NgIf, NgFor, NgClass, CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { stagger80ms } from '@vex/animations/stagger.animation';
import { VexBreadcrumbsComponent } from '@vex/components/vex-breadcrumbs/vex-breadcrumbs.component';
import { VexPageLayoutContentDirective } from '@vex/components/vex-page-layout/vex-page-layout-content.directive';
import { VexPageLayoutHeaderDirective } from '@vex/components/vex-page-layout/vex-page-layout-header.directive';
import { VexPageLayoutComponent } from '@vex/components/vex-page-layout/vex-page-layout.component';
import { SelectionModel } from '@angular/cdk/collections';
import { TableColumn } from '@vex/interfaces/table-column.interface';
import { MatSelectModule } from '@angular/material/select';
import { NotificationService } from 'src/app/auth/services/Notification.service';
import {
  MatSlideToggleChange,
  MatSlideToggleModule
} from '@angular/material/slide-toggle';
import { scaleIn400ms } from '@vex/animations/scale-in.animation';
import { fadeInRight400ms } from '@vex/animations/fade-in-right.animation';
import { MatOptionModule } from '@angular/material/core';
import Swal from 'sweetalert2';

@Component({
  selector: 'vex-company-user-list',
  templateUrl: './company-user-list.component.html',
  styleUrls: ['./company-user-list.component.scss'],
  animations: [stagger80ms, fadeInUp400ms, scaleIn400ms, fadeInRight400ms],
  standalone: true,
  imports: [
    VexPageLayoutComponent,
    MatButtonToggleModule,
    ReactiveFormsModule,
    VexPageLayoutContentDirective,
    NgIf,
    MatButtonModule,
    MatTooltipModule,
    MatIconModule,
    MatTableModule,
    MatSortModule,
    MatOptionModule,
    MatCheckboxModule,
    NgFor,
    NgClass,
    MatPaginatorModule,
    FormsModule,
    MatDialogModule,
    MatInputModule,
    CommonModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatMenuModule
  ],
  providers: [DatePipe]
})
export class CompanyUserListComponent implements OnInit {
  selectedRole: string | null = null;
  layoutCtrl = new UntypedFormControl('boxed');

  subject$: ReplaySubject<User[]> = new ReplaySubject<User[]>(1);
  data$: Observable<ResponseUser> = new Observable<ResponseUser>();
  users: User[] = [];

  @Input()
  columns: TableColumn<User>[] = [
    { label: 'Image', property: 'image_url', type: 'image', visible: true },
    {
      label: 'Prénom',
      property: 'first_name',
      type: 'text',
      visible: true,
      cssClasses: ['font-medium']
    },
    {
      label: 'Nom',
      property: 'last_name',
      type: 'text',
      visible: true
    },
    {
      label: 'Email',
      property: 'email',
      type: 'text',
      visible: true,
      cssClasses: ['text-secondary', 'font-medium']
    },
    {
      label: 'Rôle',
      property: 'name',
      type: 'text',
      visible: true
    },
    {
      label: 'Etat',
      property: 'status',
      type: 'text',
      visible: true
    },
    { label: 'Actions', property: 'actions', type: 'button', visible: true }
  ];

  dataSource!: MatTableDataSource<User>;
  selection = new SelectionModel<User>(true, []);
  searchCtrl = new UntypedFormControl();
  nbUser: number = 0;
  userObservable: User | null = null;
  meta: PaginationMeta = { ...initialPaginationMeta };

  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;

  private readonly destroyRef: DestroyRef = inject(DestroyRef);

  constructor(
    public dialog: MatDialog,
    private userService: UserService,
    private activatedRoute: ActivatedRoute,
    private notif: NotificationService,
    private authService: AuthService
  ) {
    this.searchCtrl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((searchTerm) => this.userService.getUsers(searchTerm))
      )
      .subscribe((response) => {
        this.assignData(response);
      });
  }

  showActionButton(user: User): Observable<boolean> {
    return this.authService.getCurrentUser().pipe(
      map((currentUser) => {
        return currentUser?.id !== user.id;
      })
    );
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  get visibleColumns() {
    return this.columns
      .filter((column) => column.visible)
      .map((column) => column.property);
  }

  getData() {
    this.selectedRole = null;
    this.data$ = this.activatedRoute.data.pipe(
      map((data) => {
        return data['userData'];
      })
    );
    if (this.data$) {
      this.data$.subscribe((response) => {
        this.assignData(response);
      });
    }
  }

  getPhoneNumber(user: User): string {
    return user.phone_number_one || 'N/A';
  }

  onSelectRole(role: string) {
    const roleMap: { [key: string]: string } = {
      Manager: 'Directeur',
      Seller: 'Vendeur',
      Treasurer: 'Trésorier(e)'
    };

    if (roleMap[role]) {
      this.selectedRole = roleMap[role];
      this.refreshData(role);
    }
  }

  ngOnInit() {
    this.getData();
  }

  assignData(data: ResponseUser) {
    this.users = data.data;
    this.meta = data.meta;
    this.dataSource = new MatTableDataSource<User>(this.users);
  }

  onFilterChange(value: string) {
    if (!this.dataSource) {
      return;
    }
    value = value.trim();
    value = value.toLowerCase();
    this.dataSource.filter = value;
  }

  toggleColumnVisibility(column: TableColumn<User>, event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();
    column.visible = !column.visible;
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach((row) => this.selection.select(row));
  }

  trackByProperty<T>(index: number, column: TableColumn<T>) {
    return column.property;
  }

  addUser() {
    const dialogRef = this.dialog.open(CompanyUserAddUpdateComponent, {
      width: '1000px',
      disableClose: true,
      data: {
        isEditMode: false
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.refreshData('');
      }
    });
  }

  deleteUser(element: User) {
    // const dialogRef = this.dialog.open(DeleteDialogConfirmComponent, {
    //   disableClose: true,
    //   data: {
    //     title: 'Confirmation',
    //     message: 'Voulez-vous vraiment supprimer cet utilisateur ?'
    //   }
    // });
    // dialogRef.afterClosed().subscribe((result) => {
    //   if (result) {
    //     this.userService.deleteUser(element.id).subscribe({
    //       next: (response) => {
    //         this.showMessage(response.message, 'success-snackbar');
    //         this.refreshData('');
    //       },
    //       error:(error)=>{
    //         this.showMessage(error.error.message, 'success-snackbar');
    //         this.refreshData('');
    //       }
    //     });
    //   }
    // });
  }

  update(user: User) {
    const dialogRef = this.dialog.open(CompanyUserAddUpdateComponent, {
      width: '1000px',
      disableClose: true,
      data: {
        isEditMode: true,
        user: user
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.refreshData('');
      }
    });
  }

  translateRoleName(roleName: string): string {
    switch (roleName) {
      case 'Manager':
        return 'Directeur';
      case 'Seller':
        return 'Vendeur';
      case 'Treasurer':
        return 'Trésorier';
      case 'Owner':
        return 'Proprietaire';
      default:
        return roleName;
    }
  }

  public refreshData(searchTerm: string) {
    this.userService.getUsers(searchTerm).subscribe({
      next: (response) => {
        this.assignData(response);
      }
    });
  }

  public updateStatus(element: User, event: MatSlideToggleChange) {
    const previousStatus = element.status;
    const newStatus = event.checked;

    Swal.fire({
      title: 'Confirmation',
      text: `Voulez-vous vraiment ${
        newStatus ? 'activer' : 'désactiver'
      } cet utilisateur "${element.full_name}" ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: newStatus ? 'Oui, activer' : 'Oui, désactiver',
      cancelButtonText: 'Annuler',
      customClass: {
        container: 'swal2-container-custom',
        popup: 'swal2-popup-custom',
        actions: 'swal2-actions-custom',
        confirmButton: 'swal2-confirm-custom',
        cancelButton: 'swal2-cancel-custom'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Mise à jour en cours...',
          text: 'Veuillez patienter',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        this.userService.disableUser(element.id).subscribe({
          next: (response) => {
            Swal.fire({
              icon: 'success',
              title: 'Mis à jour !',
              text:
                response.message ||
                `L'utilisateur a été ${
                  newStatus ? 'activé' : 'désactivé'
                } avec succès.`,
              timer: 2000,
              showConfirmButton: false
            });
            this.refreshData('');
          },
          error: (error) => {
            // Rétablir l'état précédent en cas d'erreur
            element.status = previousStatus;
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text:
                error?.message ||
                'Une erreur est survenue lors de la mise à jour.',
              confirmButtonColor: '#d33'
            });
          }
        });
      } else {
        // Rétablir l'état précédent si l'utilisateur annule
        event.source.checked = previousStatus;
      }
    });
  }

  delete(element: User) {
    Swal.fire({
      title: 'Confirmation',
      text: `Voulez-vous vraiment supprimer cet utilisateur "${element.full_name}" ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      customClass: {
        container: 'swal2-container-custom',
        popup: 'swal2-popup-custom',
        actions: 'swal2-actions-custom',
        confirmButton: 'swal2-confirm-custom',
        cancelButton: 'swal2-cancel-custom'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Suppression en cours...',
          text: 'Veuillez patienter',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        this.userService.deleteUser(element.id).subscribe({
          next: (response) => {
            Swal.fire({
              icon: 'success',
              title: 'Supprimé !',
              text:
                response.message || "L'utilisateur a été supprimé avec succès.",
              timer: 2000,
              showConfirmButton: false
            });
            this.refreshData('');
          },
          error: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text:
                error?.error.message ||
                'Une erreur est survenue lors de la suppression.',
              confirmButtonColor: '#d33'
            });
          }
        });
      }
    });
  }

  pageEvent(page: PageEvent) {
    this.meta.per_page = page.pageSize;
    this.meta.current_page = page.pageIndex + 1;
    // this.userService.getUserSearchPaginator('',this.meta.current_page,this.meta.per_page).subscribe({
    //   next: (response) => {
    //     this.assignData(response);
    //   }
    // });
  }
}
