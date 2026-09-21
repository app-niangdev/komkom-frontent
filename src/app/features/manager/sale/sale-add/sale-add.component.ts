import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  ReactiveFormsModule,
  FormsModule,
  Validators,
  FormControl,
  FormGroup,
  FormBuilder
} from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import {
  MatSnackBar,
  MatSnackBarConfig,
  MatSnackBarModule
} from '@angular/material/snack-bar';
import { fadeInRight400ms } from '@vex/animations/fade-in-right.animation';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { scaleIn400ms } from '@vex/animations/scale-in.animation';
import { stagger80ms } from '@vex/animations/stagger.animation';
import {
  map,
  Observable,
  startWith,
  debounceTime,
  distinctUntilChanged,
  switchMap
} from 'rxjs';
import { CategoryService } from 'src/app/auth/services/category.service';
import { CustomerService } from 'src/app/auth/services/customer.service';
import { ProductService } from 'src/app/auth/services/product.service';
import {
  SaleService,
  CustomerSale,
  NewSale,
  PaymentData,
  PaymentMethod
} from 'src/app/auth/services/sale.service';
import { SaleProductModalComponent } from '../sale-product-modal/sale-product-modal.component';
import { Category } from 'src/app/interfaces/Category';
import { Company } from 'src/app/interfaces/Company';
import { Customer } from 'src/app/interfaces/Customer';
import { Product } from 'src/app/interfaces/Product';
import { Store } from 'src/app/interfaces/Store';
import {
  initialPaginationMeta,
  PaginationMeta,
  MessageType
} from 'src/app/response-type/Type';
import { IntegerSeparatorPipe } from 'src/app/pipes/integer-separator.pipe';
import { SaleItemWithProduct } from 'src/app/interfaces/Sale';
import { AuthService } from 'src/app/auth/services/auth.service';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
type SaleItem = SaleItemWithProduct;

@Component({
  selector: 'vex-sale-add',
  templateUrl: './sale-add.component.html',
  styleUrls: ['./sale-add.component.scss'],
  standalone: true,
  animations: [stagger80ms, fadeInUp400ms, scaleIn400ms, fadeInRight400ms],
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatSelectModule,
    MatOptionModule,
    MatCheckboxModule,
    MatAutocompleteModule,
    CommonModule,
    MatProgressBarModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatListModule,
    MatButtonToggleModule,
    FormsModule,
    IntegerSeparatorPipe
  ]
})
export class SaleAddComponent implements OnInit {
  // Données
  categories: Category[] = [];
  filteredProducts: Product[] = [];
  customers: Customer[] = [];
  isSubmitting: boolean = false;
  selectedCustomerId: number | null = null;
  customerFilterCtrl: FormControl = new FormControl('');
  store!: Store;
  company!: Company;
  isLoading = true; // ← Flag de chargement

  // États
  searchQuery = '';
  searchProduct = '';
  productSearchCtrl: FormControl = new FormControl('');
  selectedCategory: number | null = null;
  customerType: 'anonymous' | 'existing' | 'new' = 'anonymous';
  selectedCustomer: Customer | null = null;
  newCustomer!: CustomerSale;
  discount = 0;
  showSuccess = false;
  newCustomerMode = false;
  saleForm!: FormGroup;
  customerForm!: FormGroup;
  customerSearchControl = new FormControl();
  filteredCustomers!: Observable<any[]>;
  isCartOpen = false;

  // Paiement
  paymentMethod: 'cash' | 'wave' | 'OM' = 'cash';
  amountGiven = 0;
  private amountGivenTouched = false;
  selectedItems: SaleItem[] = [];
  newSale!: NewSale;
  amountGivenError: string | null = null;
  isErrorAmountGivenError: boolean = false;

  meta: PaginationMeta = {
    ...initialPaginationMeta,
    per_page: 20,
    pageSizeOptions: [20, 50, 100]
  };

  get usesMeasurements(): boolean {
    return this.store?.uses_measurements !== false;
  }

  paymentMethods: PaymentMethod[] = [
    { value: 'cash', label: 'Espèce', image: 'assets/img/paiements/espece.jpg' },
    { value: 'wave', label: 'Wave', image: 'assets/img/paiements/wave.jpg' },
    { value: 'OM', label: 'Orange Money', image: 'assets/img/paiements/orange_money.png' }
  ];

  constructor(
    private dialog: MatDialog,
    private fb: FormBuilder,
    private productService: ProductService,
    private saleService: SaleService,
    private snackBar: MatSnackBar,
    private customerService: CustomerService,
    private categoryService: CategoryService,
    private authService: AuthService,
    private location: Location,
    private router: Router
  ) {
    // Initialiser le formulaire vide dans le constructeur
    this.initForms();
  }

  private initForms(): void {
    this.saleForm = this.fb.group({
      customerType: ['anonymous'],
      existingCustomer: [null],
      customer_id: [null],
      newCustomer: this.fb.group({
        name: [
          '',
          [
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(50)
          ]
        ],
        phone: [
          '',
          [
            Validators.required,
            Validators.minLength(9),
            Validators.maxLength(9),
            Validators.pattern(/^\d{9}$/)
          ]
        ]
      })
    });

    this.customerForm = this.fb.group({
      name: [
        '',
        [Validators.required, Validators.minLength(2), Validators.maxLength(50)]
      ],
      phone: [
        '',
        [
          Validators.required,
          Validators.minLength(9),
          Validators.maxLength(9),
          Validators.pattern(/^\d{9}$/)
        ]
      ]
    });
  }

  ngOnInit(): void {
    this.authService.getUserAuth().subscribe({
      next: (response) => {
        const roleName = response.user?.role?.name?.toLowerCase();

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
    this.loadData();
    this.initCustomerFilter();
    this.initProductSearch();
    this.isLoading = false;
  }

  private initProductSearch(): void {
    this.productSearchCtrl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value: string) => {
        this.searchProduct = (value || '').toLowerCase().trim();
        this.loadProducts(true);
      });
  }

  private initCustomerFilter(): void {
    this.filteredCustomers = this.customerSearchControl.valueChanges.pipe(
      startWith(''),
      map((value) => (typeof value === 'string' ? value : value?.name)),
      map((name) =>
        name ? this._filterCustomers(name) : this.customers.slice()
      )
    );
  }

  private _filterCustomers(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(filterValue) ||
        customer.phone.includes(filterValue)
    );
  }

  loadCustomers(): void {
    this.customerService.list(this.store.id, '').subscribe({
      next: (response) => {
        this.customers = response.data;
      },
      error: (error) => {
        this.snackBar.open('Erreur lors du chargement des clients', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  loadProducts(resetPage: boolean = false): void {
    if (resetPage) {
      this.meta.current_page = 1;
    }

    this.productService
      .available(
        this.store.id,
        this.selectedCategory,
        this.searchProduct,
        this.meta.current_page,
        this.meta.per_page
      )
      .subscribe({
        next: (response) => {
          this.filteredProducts = response.data;
          this.meta = { ...this.meta, ...response.meta };
        },
        error: (error) => {
          this.snackBar.open('Erreur lors du chargement des produits', 'Fermer', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  displayCustomerFn(customer: Customer): string {
    return customer ? `${customer.name} - ${customer.phone}` : '';
  }

  getStockQuantity(product: Product): number {
    return Math.floor(product.base_unit_quantity ?? product.stock_quantity ?? 0);
  }

  isStockAboveThreshold(product: Product): boolean {
    return this.getStockQuantity(product) > (product.alert_threshold ?? 0);
  }

  loadData(): void {
    this.loadProducts(true);
    this.loadCustomers();
    this.loadCategories();
  }

  setCustomerType(type: 'anonymous' | 'existing' | 'new'): void {
    this.saleForm.get('customerType')?.setValue(type);
    if (type === 'anonymous') {
      this.selectedCustomer = null;
    }
    if (type === 'new') {
      this.newCustomer = { name: '', phone: '' };
    }
  }

  selectCategory(category: number | null): void {
    this.selectedCategory = category;
    this.loadProducts(true);
  }

  loadCategories() {
    this.categoryService.list(this.store.id).subscribe({
      next: (response) => {
        this.categories = response.data;
      }
    });
  }

  openProductDetail(product: Product): void {
    const existingItem = this.selectedItems.find(
      (item) => item.product.id === product.id
    );

    // Déterminer l'unité de mesure par défaut (l'unité de base)
    const defaultUnit =
      product.unit_of_measures?.find((u) => u.is_base_unit) ||
      product.unit_of_measures?.[0];

    const dialogRef = this.dialog.open(SaleProductModalComponent, {
      disableClose: true,
      width: '500px',
      maxWidth: '95vw',
      maxHeight: '95vh',
      panelClass: 'sale-product-modal-panel',
      autoFocus: false,
      data: {
        product: product,
        quantity: existingItem?.quantity || 1,
        unit_price_at_sale:
          existingItem?.unit_price_at_sale ||
          defaultUnit?.price ||
          product.unit_price ||
          0,
        serial_numbers: existingItem?.serial_numbers || [],
        isUpdate: !!existingItem,
        selected_unit_of_measure_id:
          existingItem?.unit_of_measure_id || defaultUnit?.id,
        uses_measurements: this.usesMeasurements
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (existingItem) {
          const index = this.selectedItems.findIndex(
            (item) => item.product.id === product.id
          );
          this.selectedItems[index] = {
            product: product,
            quantity: result.quantity,
            unit_price_at_sale: result.unit_price_at_sale,
            serial_numbers: result.serial_numbers,
            unit_of_measure_id: result.unit_of_measure_id,
            base_unit_quantity: result.base_unit_quantity
          };

          this.snackBar.open('Produit mis à jour dans le panier', 'OK', {
            duration: 2000,
            panelClass: ['success-snackbar']
          });
        } else {
          this.selectedItems.push({
            product: product,
            quantity: result.quantity,
            unit_price_at_sale: result.unit_price_at_sale,
            serial_numbers: result.serial_numbers,
            unit_of_measure_id: result.unit_of_measure_id,
            base_unit_quantity: result.base_unit_quantity
          });

          this.snackBar.open('Produit ajouté au panier', 'OK', {
            duration: 2000,
            panelClass: ['success-snackbar']
          });
        }
      }
    });
  }

  removeFromCart(productId: number): void {
    this.selectedItems = this.selectedItems.filter(
      (item) => item.product.id !== productId
    );
  }

  updateQuantity(productId: number, newQuantity: number): void {
    if (newQuantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    const item = this.selectedItems.find(
      (item) => item.product.id === productId
    );
    if (!item) return;

    const product = item.product;
    const nextQuantity = Number(newQuantity);

    if (!this.usesMeasurements && !Number.isInteger(nextQuantity)) {
      this.snackBar.open(
        'Cette boutique n autorise que des quantites entieres.',
        'OK',
        { duration: 3000, panelClass: ['error-snackbar'] }
      );
      return;
    }

    if (product.require_serial_number && !Number.isInteger(nextQuantity)) {
      this.snackBar.open(
        'Les produits avec numero de serie exigent des quantites entieres.',
        'OK',
        { duration: 3000, panelClass: ['error-snackbar'] }
      );
      return;
    }

    // Calculer la quantité en base_unit pour la nouvelle quantité
    const selectedUnit = product.unit_of_measures?.find(
      (u) => u.id === item.unit_of_measure_id
    );
    const newBaseQuantity = selectedUnit
      ? newQuantity * selectedUnit.conversion_factor
      : newQuantity;

    const maxStock = product.base_unit_quantity || product.stock_quantity || 0;
    if (newBaseQuantity > maxStock) {
      const maxInUnit = selectedUnit
        ? Math.floor(maxStock / selectedUnit.conversion_factor)
        : maxStock;
      this.snackBar.open(
        `Stock insuffisant. Stock disponible: ${maxInUnit} ${
          selectedUnit?.name || ''
        }`,
        'OK',
        { duration: 3000, panelClass: ['error-snackbar'] }
      );
      return;
    }

    if (product.require_serial_number && newQuantity > item.quantity) {
      const dialogRef = this.dialog.open(SaleProductModalComponent, {
        disableClose: true,
        width: '500px',
        maxWidth: '95vw',
        maxHeight: '95vh',
        panelClass: 'sale-product-modal-panel',
        autoFocus: false,
        data: {
          product: product,
          quantity: newQuantity,
          unit_price_at_sale: item.unit_price_at_sale,
          serial_numbers: item.serial_numbers,
          isUpdate: true,
          selected_unit_of_measure_id: item.unit_of_measure_id,
          uses_measurements: this.usesMeasurements
        }
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          const index = this.selectedItems.findIndex(
            (i) => i.product.id === productId
          );
          this.selectedItems[index] = {
            product: product,
            quantity: result.quantity,
            unit_price_at_sale: result.unit_price_at_sale,
            serial_numbers: result.serial_numbers,
            unit_of_measure_id: result.unit_of_measure_id,
            base_unit_quantity: result.base_unit_quantity
          };

          this.snackBar.open('Produit mis à jour dans le panier', 'OK', {
            duration: 2000,
            panelClass: ['success-snackbar']
          });
        }
      });
    } else {
      item.quantity = newQuantity;
      item.base_unit_quantity = newBaseQuantity;
    }
  }

  getUnitName(item: SaleItem): string {
    const unit = item.product.unit_of_measures?.find(
      (u) => u.id === item.unit_of_measure_id
    );
    return unit?.name || item.product.base_unit || '';
  }

  getCartTotal(): number {
    return this.selectedItems.reduce(
      (total, item) => total + item.unit_price_at_sale * item.quantity,
      0
    );
  }

  getFinalTotal(): number {
    return Math.max(0, this.getCartTotal() - this.discount);
  }

  toggleCart(): void {
    this.isCartOpen = !this.isCartOpen;
  }

  finalizePayment(): void {
    if (this.selectedItems.length === 0) return;

    if (this.saleForm.get('customerType')?.value === 'anonymous' && !this.isPaymentValid()) {
      this.showMessage(
        'Veuillez renseigner un mode de paiement valide.',
        'error-snackbar'
      );
      return;
    }

    this.processPayment({});
  }

  getChange(): number {
    return this.paymentMethod === 'cash'
      ? Math.max(0, this.displayedAmountGiven - this.getFinalTotal())
      : 0;
  }

  isPaymentValid(): boolean {
    if (this.selectedItems.length === 0) {
      return false;
    }

    if (
      this.paymentMethod === 'cash' &&
      this.displayedAmountGiven < this.getFinalTotal()
    ) {
      return false;
    }

    return true;
  }

  selectPaymentMethod(method: PaymentMethod): void {
    this.paymentMethod = method.value;
    if (method.value === 'cash') {
      this.amountGivenTouched = false;
    }
  }

  /** Montant reçu affiché : suit automatiquement le total du panier tant que l'utilisateur ne l'a pas modifié. */
  get displayedAmountGiven(): number {
    return this.amountGivenTouched ? this.amountGiven : this.getFinalTotal();
  }

  onAmountGivenChange(value: number): void {
    this.amountGivenTouched = true;
    this.amountGiven = value;
    this.validateAmountGiven();
  }

  getPaymentData(): any {
    return {
      paymentMethod: this.paymentMethod,
      amountGiven: this.amountGiven
    };
  }

  closeAllModals(): void {
    this.dialog.closeAll();
  }

  validateAmountGiven() {
    this.amountGivenError = null;
    if (this.amountGiven > this.getCartTotal()) {
      this.isErrorAmountGivenError = true;
      this.amountGivenError = `Le montant donné (${
        this.amountGiven
      }) est trop élevé. Le montant maximum est ${this.getCartTotal()}.`;
      this.amountGiven = this.getCartTotal();
    } else {
      this.isErrorAmountGivenError = false;
    }
  }

  processPayment(_paymentData: any): void {
    this.isSubmitting = true;
    const customerType = this.saleForm.get('customerType')?.value;

    const salePayload: NewSale = {
      store_id: this.store.id,
      customer_type: customerType,
      discount: this.discount,
      items: this.selectedItems.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price_at_sale: item.unit_price_at_sale,
        subtotal: item.quantity * item.unit_price_at_sale,
        serial_numbers:
          item.serial_numbers && item.serial_numbers.length > 0
            ? item.serial_numbers
            : undefined,
        unit_of_measure_id: item.unit_of_measure_id,
        base_unit_quantity: item.base_unit_quantity
      }))
    };

    if (customerType === 'existing') {
      const customerId = this.saleForm.get('customer_id')?.value;
      if (customerId) {
        salePayload.customer_id = customerId;
      }
    } else if (customerType === 'new') {
      const newCustomerData = this.saleForm.get('newCustomer')?.value;
      if (newCustomerData) {
        salePayload.new_customer = {
          name: newCustomerData.name,
          phone: newCustomerData.phone
        };
      }
    }

    this.saleService.addSale(salePayload).subscribe({
      next: (response) => {
        if (customerType === 'anonymous' && response.sale_id) {
          this.encaisserAnonymousSale(response.sale_id);
        } else {
          this.showMessage(response.message, 'success-snackbar');
          this.showSuccess = true;
          this.dialog.closeAll();
          this.isSubmitting = false;

          // Rediriger vers la liste des ventes après un court délai
          setTimeout(() => {
            this.router.navigate(['/index/manager/sale/list'], {
              state: { store: this.store, company: this.company }
            });
          }, 1000);
        }
      },
      error: (error) => {
        const errorMessage =
          error?.error?.message ||
          error?.error ||
          'Erreur lors de la création de la vente';
        this.showMessage(errorMessage, 'error-snackbar');
        this.showSuccess = false;
        this.isSubmitting = false;
      }
    });
  }

  /** Vente anonyme : valide la vente et encaisse le paiement en un seul flux, sans passer par la facture. */
  private encaisserAnonymousSale(saleId: number): void {
    const payment: PaymentData = {
      payment_type: this.paymentMethod,
      amount: this.paymentMethod === 'cash' ? this.getFinalTotal() : this.displayedAmountGiven
    };

    this.saleService.validateSale(saleId, this.store.id, payment).subscribe({
      next: () => {
        this.showMessage('Vente encaissée avec succès', 'success-snackbar');
        this.showSuccess = true;
        this.dialog.closeAll();
        this.isSubmitting = false;

        setTimeout(() => {
          this.router.navigate(['/index/manager/sale/list'], {
            state: { store: this.store, company: this.company }
          });
        }, 1000);
      },
      error: (error) => {
        const errorMessage =
          error?.error?.message ||
          error?.error ||
          "Erreur lors de l'encaissement de la vente";
        this.showMessage(errorMessage, 'error-snackbar');
        this.showSuccess = false;
        this.isSubmitting = false;
      }
    });
  }

  onCustomerSearch(event: Event): void {
    this.customerFilterCtrl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((searchTerm) =>
          this.customerService.list(this.store.id, searchTerm)
        )
      )
      .subscribe((response) => {
        this.customers = response.data;
      });
  }

  onCustomerSelected(customer: Customer): void {
    if (customer) {
      this.saleForm.get('customer')?.setValue(null);
      this.saleForm.get('customer_id')?.setValue(customer.id);
      this.newCustomerMode = false;
    }
  }

  resetPOS(): void {
    this.selectedItems = [];
    this.discount = 0;
    this.customerType = 'anonymous';
    this.selectedCustomer = null;
    this.newCustomer = { name: '', phone: '' };
    this.showSuccess = false;
    this.isSubmitting = false;
    this.paymentMethod = 'cash';
    this.amountGiven = 0;
    this.amountGivenTouched = false;
  }

  goBack() {
    this.location.back();
  }

  isPayButtonEnabled(): boolean {
    if (this.selectedItems.length === 0) {
      return false;
    }

    const customerType = this.saleForm.get('customerType')?.value;

    if (customerType === 'anonymous') {
      return this.isPaymentValid();
    }

    if (customerType === 'existing') {
      return !!this.saleForm.get('customer_id')?.value;
    }

    if (customerType === 'new') {
      const newCustomerGroup = this.saleForm.get('newCustomer') as FormGroup;
      return newCustomerGroup.valid;
    }

    return false;
  }

  private showMessage(message: string, panelClass: MessageType) {
    const config = new MatSnackBarConfig();
    config.duration = 3000;
    config.horizontalPosition = 'end';
    config.verticalPosition = 'top';
    config.panelClass = [panelClass];
    this.snackBar.open(message, 'Fermer', config);
  }

  pageEvent(page: PageEvent) {
    this.meta.per_page = page.pageSize;
    this.meta.current_page = page.pageIndex + 1;
    this.loadProducts();
  }
}
