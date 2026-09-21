import { NgIf, NgFor, CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  ReactiveFormsModule,
  FormsModule,
  UntypedFormControl,
  FormGroup,
  Validators,
  FormBuilder
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent
} from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { KomkomPageLoaderComponent } from 'src/app/layouts/components/page-loader/page-loader.component';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { fadeInRight400ms } from '@vex/animations/fade-in-right.animation';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { scaleIn400ms } from '@vex/animations/scale-in.animation';
import { stagger80ms } from '@vex/animations/stagger.animation';
import { VexPageLayoutContentDirective } from '@vex/components/vex-page-layout/vex-page-layout-content.directive';
import { VexPageLayoutComponent } from '@vex/components/vex-page-layout/vex-page-layout.component';
import { TableColumn } from '@vex/interfaces/table-column.interface';
import {
  debounceTime,
  distinctUntilChanged,
  Subject,
  switchMap,
  take,
  takeUntil
} from 'rxjs';
import { Company } from 'src/app/interfaces/Company';
import { Store } from 'src/app/interfaces/Store';
import {
  PaginationMeta,
  initialPaginationMeta
} from 'src/app/response-type/Type';
import Swal from 'sweetalert2';
import { Category, CategoryResponse } from 'src/app/interfaces/Category';
import { CategoryService } from 'src/app/auth/services/category.service';
import { NotificationService } from 'src/app/auth/services/Notification.service';
import { AuthService } from 'src/app/auth/services/auth.service';
import { StoreHeaderComponent } from 'src/app/features/store-header/store-header.component';
import {
  navigateStoreBack,
  readStoreNavigationState,
  resolveStoreContext
} from 'src/app/core/utils/store-context.util';

@Component({
  selector: 'vex-category-list',
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.scss'],
  standalone: true,
  animations: [stagger80ms, fadeInUp400ms, scaleIn400ms, fadeInRight400ms],
  imports: [
    VexPageLayoutComponent,
    MatButtonToggleModule,
    ReactiveFormsModule,
    VexPageLayoutContentDirective,
    NgIf,
    MatButtonModule,
    MatTooltipModule,
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
    MatIconModule,
    MatProgressSpinnerModule,
    KomkomPageLoaderComponent,
    StoreHeaderComponent
  ]
})
export class CategoryListComponent implements OnInit, OnDestroy {
  store!: Store;
  company: Company | null = null;
  isOwner = false;
  isReady = false;
  isLoading = true;
  isSeller = false;
  mobileFormOpen = false;

  searchCtrl = new UntypedFormControl();
  layoutCtrl = new UntypedFormControl('boxed');
  categories: Category[] = [];
  meta: PaginationMeta = { ...initialPaginationMeta };
  categoryForm!: FormGroup;
  isEditing = false;
  categorieUpdate!: Category;
  dataSource!: MatTableDataSource<Category>;

  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;

  @Input() columns: TableColumn<Category>[] = [
    {
      label: 'Nom de la catégorie',
      property: 'name',
      type: 'text',
      visible: true
    },
    {
      label: 'Description',
      property: 'description',
      type: 'text',
      visible: true
    },
    { label: 'Actions', property: 'actions', type: 'button', visible: true }
  ];

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    public dialog: MatDialog,
    private categoryService: CategoryService,
    private cd: ChangeDetectorRef,
    private fb: FormBuilder,
    private router: Router
  ) {}

  get visibleColumns() {
    return this.columns.filter((c) => c.visible).map((c) => c.property);
  }

  ngOnInit() {
    const navState = readStoreNavigationState();

    this.authService
      .getUserAuth()
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const role = response.user?.role?.name?.toLowerCase();
          this.isSeller = role === 'seller';

          const context = resolveStoreContext(response, navState);
          if (!context) {
            this.goBack();
            return;
          }

          this.store = context.store;
          this.company = context.company ?? null;
          this.isOwner = context.isOwner;
          this.isReady = true;
          this.initComponent();
        },
        error: (err) => {
          console.error("Erreur lors de la récupération de l'utilisateur", err);
          this.isLoading = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initComponent(): void {
    this.categoryForm = this.buildForm();
    this.loadCategories();
    this.searchCtrl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => this.fetchCategories(term ?? '')),
        takeUntil(this.destroy$)
      )
      .subscribe((response) => this.assignData(response));
  }

  private buildForm(): FormGroup {
    return this.fb.group({
      name: [
        '',
        [Validators.required, Validators.minLength(2), Validators.maxLength(50)]
      ],
      description: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(254)
        ]
      ],
      store_id: [this.store?.id ?? null]
    });
  }

  trackByCategoryId(_index: number, category: Category): number {
    return category.id;
  }

  openMobileForm(): void {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      this.mobileFormOpen = true;
    }
  }

  closeMobileForm(): void {
    this.mobileFormOpen = false;
    if (this.isEditing) {
      this.resetForm(false);
    }
  }

  private fetchCategories(
    search = '',
    page = this.meta.current_page,
    perPage = this.meta.per_page
  ) {
    return this.categoryService.list(this.store.id, search, page, perPage);
  }

  assignData(data: CategoryResponse) {
    this.categories = data.data;
    this.meta = data.meta;
    this.dataSource = new MatTableDataSource<Category>(this.categories);
    this.isLoading = false;
  }

  loadCategories() {
    this.isLoading = true;
    this.fetchCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => this.assignData(response),
        error: () => (this.isLoading = false)
      });
  }

  pageEvent(page: PageEvent) {
    this.meta.per_page = page.pageSize;
    this.meta.current_page = page.pageIndex + 1;
    this.isLoading = true;
    this.fetchCategories(this.searchCtrl.value ?? '')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => this.assignData(response),
        error: () => (this.isLoading = false)
      });
  }

  toggleColumnVisibility(column: TableColumn<Category>, event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();
    column.visible = !column.visible;
  }

  resetForm(closeSheet = true) {
    this.categoryForm.reset({
      name: '',
      description: '',
      store_id: this.store.id
    });
    Object.values(this.categoryForm.controls).forEach((control) => {
      control.markAsPristine();
      control.markAsUntouched();
      control.setErrors(null);
    });
    this.isEditing = false;
    if (closeSheet) {
      this.mobileFormOpen = false;
    }
  }

  onSubmit() {
    if (!this.categoryForm.valid) return;

    const request$ = this.isEditing
      ? this.categoryService.update(
          this.categorieUpdate.id,
          this.categoryForm.value
        )
      : this.categoryService.add(this.categoryForm.value);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.notificationService.success(response.message);
        this.loadCategories();
        this.resetForm();
      },
      error: (err) => console.error(err)
    });
  }

  editCategory(category: Category) {
    this.isEditing = true;
    this.categorieUpdate = category;
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description
    });
    this.openMobileForm();
  }

  createCategory() {
    this.resetForm(false);
    this.openMobileForm();
  }

  delete(category: Category) {
    this.cd.detectChanges();
    Swal.fire({
      title: 'Confirmation',
      text: `Voulez-vous vraiment supprimer cette catégorie "${category.name}" ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      customClass: swalCustomClass
    }).then((result) => {
      if (!result.isConfirmed) return;

      Swal.fire({
        title: 'Suppression en cours...',
        text: 'Veuillez patienter',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      this.categoryService.delete(category.id).subscribe({
        next: (res) => {
          Swal.fire({
            icon: 'success',
            title: 'Supprimé !',
            text: res.message || 'La catégorie a été supprimée avec succès.',
            timer: 2000,
            showConfirmButton: false
          });
          this.loadCategories();
        },
        error: (err) =>
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text:
              err?.error?.message ||
              'Une erreur est survenue lors de la suppression.',
            confirmButtonColor: '#d33',
            customClass: swalCustomClass
          })
      });
    });
  }

  goBack = (): void => {
    navigateStoreBack(this.router, {
      isOwner: this.isOwner,
      store: this.store,
      company: this.company
    });
  };
}

const swalCustomClass = {
  container: 'swal2-container-custom',
  popup: 'swal2-popup-custom',
  actions: 'swal2-actions-custom',
  confirmButton: 'swal2-confirm-custom',
  cancelButton: 'swal2-cancel-custom'
};
