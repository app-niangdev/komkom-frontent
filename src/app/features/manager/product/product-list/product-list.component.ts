import { SelectionModel } from '@angular/cdk/collections';
import { NgIf, NgFor, NgClass, CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import {
  ReactiveFormsModule,
  FormsModule,
  UntypedFormControl
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
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent
} from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { KomkomPageLoaderComponent } from 'src/app/layouts/components/page-loader/page-loader.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { fadeInRight400ms } from '@vex/animations/fade-in-right.animation';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { scaleIn400ms } from '@vex/animations/scale-in.animation';
import { stagger80ms } from '@vex/animations/stagger.animation';
import { VexPageLayoutContentDirective } from '@vex/components/vex-page-layout/vex-page-layout-content.directive';
import { TableColumn } from '@vex/interfaces/table-column.interface';
import { ReplaySubject, Observable } from 'rxjs';
import { CategoryService } from 'src/app/auth/services/category.service';
import { ProductService } from 'src/app/auth/services/product.service';
import { Category } from 'src/app/interfaces/Category';
import { Product, ProductResponse } from 'src/app/interfaces/Product';
import {
  PaginationMeta,
  initialPaginationMeta
} from 'src/app/response-type/Type';
import { ProductAddUpdateComponent } from '../product-add-update/product-add-update.component';
import { Store } from 'src/app/interfaces/Store';
import { Company } from 'src/app/interfaces/Company';
import { QuantityFormatPipe } from 'src/app/pipes/quantity-format.pipe';
import { IntegerSeparatorPipe } from 'src/app/pipes/integer-separator.pipe';
import Swal from 'sweetalert2';
import { AuthService } from 'src/app/auth/services/auth.service';
import { Location } from '@angular/common';
import { StoreHeaderComponent } from 'src/app/features/store-header/store-header.component';

@Component({
  selector: 'vex-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
  animations: [stagger80ms, fadeInUp400ms, scaleIn400ms, fadeInRight400ms],
  standalone: true,
  imports: [
    MatButtonToggleModule,
    ReactiveFormsModule,
    VexPageLayoutContentDirective,
    NgIf,
    MatButtonModule,
    MatTooltipModule,
    MatIconModule,
    MatMenuModule,
    MatTableModule,
    MatSortModule,
    MatSelectModule,
    MatOptionModule,
    MatCheckboxModule,
    NgFor,
    NgClass,
    MatPaginatorModule,
    FormsModule,
    MatDialogModule,
    MatInputModule,
    MatSnackBarModule,
    CommonModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    KomkomPageLoaderComponent,
    QuantityFormatPipe,
    IntegerSeparatorPipe,
    StoreHeaderComponent
  ]
})
export class ProductListComponent implements OnInit {
  selectedCategory: Category | null = null;
  layoutCtrl = new UntypedFormControl('boxed');
  subject$: ReplaySubject<Product[]> = new ReplaySubject<Product[]>(1);
  data$: Observable<ProductResponse> = new Observable<ProductResponse>();
  products: Product[] = [];
  categories: Category[] = [];
  nb_product: number = 0;

  dataSource: MatTableDataSource<Product> = new MatTableDataSource<Product>([]);
  selection = new SelectionModel<Product>(true, []);
  searchCtrl = new UntypedFormControl();
  nbProduct: number = 0;

  meta: PaginationMeta = {
    ...initialPaginationMeta,
    per_page: 20,
    pageSizeOptions: [20, 50, 100]
  };
  store!: Store;
  company: Company | null = null;
  isLoading = true; // ← Flag de chargement
  isSeller = false; // ← Flag pour vérifier si l'utilisateur est un Seller
  /** Filtres repliés par défaut sur mobile pour libérer l'écran */
  mobileFiltersExpanded = false;

  get usesMeasurements(): boolean {
    return this.store?.uses_measurements !== false;
  }

  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;

  constructor(
    public dialog: MatDialog,
    private productService: ProductService,
    private categoryService: CategoryService,
    private location: Location,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.getUserAuth().subscribe({
      next: (response) => {
        const roleName = response.user?.role?.name?.toLowerCase();

        // Vérifier si l'utilisateur est un Seller
        this.isSeller = roleName === 'seller';

        if (roleName === 'owner') {
          // Owner : récupérer le store depuis le state de navigation
          if (history.state.store && history.state.company) {
            this.store = history.state.store;
            this.company = history.state.company;
            this.initComponent();
          } else {
            this.goBack();
          }
        } else {
          // Manager ou Seller : le store vient de l'API
          this.store = response.store;
          if (response.company) {
            this.company = response.company;
          }
          this.initComponent();
        }
      },
      error: (err) => {
        console.error("Erreur lors de la récupération de l'utilisateur", err);
        this.isLoading = false;
      }
    });
  }

  private initComponent(): void {
    this.isLoading = true;
    this.loadCategories();
    this.refreshData('');
  }

  trackByProductId(_index: number, product: Product): number {
    return product.id;
  }

  toggleMobileFilters(): void {
    this.mobileFiltersExpanded = !this.mobileFiltersExpanded;
  }

  /** Lance la recherche à partir du bouton "Rechercher" (retour à la 1ère page). */
  search(): void {
    this.meta.current_page = 1;
    this.loadProducts();
  }

  /** Recharge la liste en tenant compte de la recherche, de la catégorie et de la pagination. */
  private loadProducts(): void {
    const searchTerm = (this.searchCtrl.value || '').trim();
    const categoryId = this.selectedCategory?.id ?? null;
    this.productService
      .list(
        this.store.id,
        categoryId,
        searchTerm,
        this.meta.current_page,
        this.meta.per_page
      )
      .subscribe({
        next: (response) => {
          this.assignData(response);
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }

  private loadCategories(): void {
    this.categoryService.list(this.store.id).subscribe({
      next: (response) => {
        this.categories = response.data;
      }
    });
  }

  // Filtrer par catégorie
  filterByCategory() {
    this.meta.current_page = 1;
    this.loadProducts();
  }

  // Réinitialiser la recherche et les filtres
  resetFilters() {
    this.searchCtrl.setValue('');
    this.selectedCategory = null;
    this.meta.current_page = 1;
    this.loadProducts();
  }

  getStockBadgeClass(stockQuantity: number, alert_quantity: number): string {
    return stockQuantity > alert_quantity ? 'bg-green-500' : 'bg-red-500';
  }

  assignData(data: ProductResponse) {
    this.products = data.data;
    this.meta = { ...data.meta, pageSizeOptions: this.meta.pageSizeOptions };
    this.nbProduct = this.meta.total;
    this.dataSource = new MatTableDataSource<Product>(this.products);
  }

  toggleColumnVisibility(column: TableColumn<any>, event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();
    column.visible = !column.visible;
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach((row) => this.selection.select(row));
  }

  trackByProperty<T>(index: number, column: TableColumn<T>) {
    return column.property;
  }

  add() {
    const dialogRef = this.dialog.open(ProductAddUpdateComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '95vh',
      disableClose: true,
      data: {
        isEditMode: false,
        title: 'Ajouter un produit',
        store: this.store
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.refreshData('');
      }
    });
  }

  delete(product: Product) {
    Swal.fire({
      title: 'Confirmation',
      text: `Voulez-vous vraiment supprimer ce produit "${product.name}" ?`,
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

        this.productService.delete(product.id).subscribe({
          next: (response) => {
            Swal.fire({
              icon: 'success',
              title: 'Supprimé !',
              text:
                response.message || 'Le produit a été supprimé avec succès.',
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
              confirmButtonColor: '#d33',
              customClass: {
                container: 'swal2-container-custom',
                popup: 'swal2-popup-custom',
                actions: 'swal2-actions-custom',
                confirmButton: 'swal2-confirm-custom',
                cancelButton: 'swal2-cancel-custom'
              }
            });
          }
        });
      }
    });
  }

  update(product: Product) {
    const dialogRef = this.dialog.open(ProductAddUpdateComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '95vh',
      disableClose: true,
      data: {
        isUpdateMode: true,
        productUpdate: product,
        store: this.store
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.refreshData('');
      }
    });
  }

  public refreshData(_searchTerm: string = '') {
    this.loadProducts();
  }

  pageEvent(page: PageEvent) {
    this.meta.per_page = page.pageSize;
    this.meta.current_page = page.pageIndex + 1;
    this.loadProducts();
  }

  goBack() {
    this.location.back();
  }

  getBaseUnitName(product: Product): string {
    const baseUnit = product.unit_of_measures?.find(
      (unit) => unit.is_base_unit
    );
    return baseUnit ? baseUnit.name : 'unité';
  }

  getBasePrice(product: Product): number | null {
    const baseUnit = product.unit_of_measures?.find(
      (unit) => unit.is_base_unit
    );
    return baseUnit ? baseUnit.price : null;
  }

  hasLowStock(product: Product): boolean {
    if (!product.alert_threshold || !product.base_unit_quantity) return false;
    const currentStock = product.base_unit_quantity;
    const threshold = product.alert_threshold;
    return currentStock <= threshold;
  }
}
