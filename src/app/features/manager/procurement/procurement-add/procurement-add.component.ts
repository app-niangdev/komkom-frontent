import { NgIf, NgFor } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormGroup,
  Validators,
  FormArray,
  AbstractControl,
  ValidationErrors,
  FormBuilder,
  ReactiveFormsModule,
  FormControl,
  ValidatorFn
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  of,
  Subject,
  switchMap,
  take,
  takeUntil,
  tap
} from 'rxjs';
import { Router } from '@angular/router';
import {
  navigateStoreBack,
  navigateToProcurementList,
  readStoreNavigationState,
  resolveStoreContext
} from 'src/app/core/utils/store-context.util';
import { fadeInRight400ms } from '@vex/animations/fade-in-right.animation';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { scaleIn400ms } from '@vex/animations/scale-in.animation';
import { stagger80ms } from '@vex/animations/stagger.animation';
import { NotificationService } from 'src/app/auth/services/Notification.service';
import { ProcurementService } from 'src/app/auth/services/procurement.service';
import { ProductService } from 'src/app/auth/services/product.service';
import { SupplierService } from 'src/app/auth/services/supplier.service';
import { Company } from 'src/app/interfaces/Company';
import { AddProcurement, Procurement } from 'src/app/interfaces/Procurement';
import { Product } from 'src/app/interfaces/Product';
import { Store } from 'src/app/interfaces/Store';
import { Supplier } from 'src/app/interfaces/Supplier';
import { IntegerSeparatorPipe } from 'src/app/pipes/integer-separator.pipe';
import { AuthService } from 'src/app/auth/services/auth.service';

@Component({
  selector: 'vex-procurement-add',
  templateUrl: './procurement-add.component.html',
  styleUrls: ['./procurement-add.component.scss'],
  standalone: true,
  animations: [stagger80ms, scaleIn400ms, fadeInRight400ms, fadeInUp400ms],
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    NgIf,
    NgFor,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    MatDividerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressBarModule,
    IntegerSeparatorPipe
  ]
})
export class ProcurementAddComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  // Chaque ligne a sa propre liste de produits pour éviter les conflits
  productsPerLine: { [key: number]: Product[] } = {};
  suppliers: Supplier[] = [];
  store!: Store;
  company?: Company;
  isOwner = false;
  isReady = false;

  procurementForm!: FormGroup;
  isSubmitting = false;

  isUpdateMode = false;
  procurementToUpdate?: Procurement;

  // Contrôles de recherche
  supplierSearchCtrl = new FormControl('');
  productSearchCtrls: { [key: number]: FormControl } = {};

  // États de chargement
  isLoadingSuppliers = false;
  isLoadingProducts: { [key: number]: boolean } = {};

  // Pour nettoyage des subscriptions
  private destroy$ = new Subject<void>();
  private readonly integerPattern = /^\d+$/;

  constructor(
    private productService: ProductService,
    private supplierService: SupplierService,
    private procurementService: ProcurementService,
    private notificationService: NotificationService,
    private router: Router,
    private fb: FormBuilder,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const navState = readStoreNavigationState();
    if (navState.isUpdateMode && navState.procurement) {
      this.isUpdateMode = true;
      this.procurementToUpdate = navState.procurement as Procurement;
    }

    this.authService
      .getUserAuth()
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const context = resolveStoreContext(response, navState);
          if (!context) {
            this.goBack();
            return;
          }
          this.store = context.store;
          this.company = context.company;
          this.isOwner = context.isOwner;
          this.isReady = true;
          this.initComponent();
        },
        error: (err) => {
          console.error("Erreur lors de la récupération de l'utilisateur", err);
          this.goBack();
        }
      });
  }

  private initComponent(): void {
    this.initializeForm();
    this.getSuppliers();
    this.getProducts();
    this.setupSupplierSearch();
    if (this.isUpdateMode && this.procurementToUpdate) {
      this.populateFormWithProcurementData();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── RECHERCHE FOURNISSEUR ───────────────────────────────────────────────

  setupSupplierSearch(): void {
    this.supplierSearchCtrl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => (this.isLoadingSuppliers = true)),
        switchMap((term) =>
          this.supplierService
            .getSupplier(this.store.id, term || '')
            .pipe(catchError(() => of({ data: [] })))
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((response) => {
        this.suppliers = response.data;
        this.isLoadingSuppliers = false;
      });
  }

  // ─── RECHERCHE PRODUIT (par ligne) ──────────────────────────────────────

  setupProductSearch(lineItemIndex: number): void {
    if (!this.productSearchCtrls[lineItemIndex]) {
      this.productSearchCtrls[lineItemIndex] = new FormControl('');
    }

    // Initialiser la liste pour cette ligne si pas encore fait
    if (!this.productsPerLine[lineItemIndex]) {
      this.productsPerLine[lineItemIndex] = [...this.products];
    }

    this.productSearchCtrls[lineItemIndex].valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => (this.isLoadingProducts[lineItemIndex] = true)),
        switchMap((term) =>
          this.productService
            .list(this.store.id, null, term || '')
            .pipe(catchError(() => of({ data: [] })))
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((response) => {
        this.productsPerLine[lineItemIndex] = response.data;
        this.isLoadingProducts[lineItemIndex] = false;
      });
  }

  getProductsForLine(index: number): Product[] {
    return this.productsPerLine[index] ?? this.products;
  }

  // ─── FORMULAIRE ─────────────────────────────────────────────────────────

  initializeForm(): void {
    this.procurementForm = this.fb.group({
      supplier_id: [null, Validators.required],
      status: ['pending', Validators.required],
      line_items: this.fb.array([])
    });
  }

  get lineItems(): FormArray {
    return this.procurementForm.get('line_items') as FormArray;
  }

  get usesMeasurements(): boolean {
    return this.store?.uses_measurements !== false;
  }

  createLineItem(): FormGroup {
    return this.fb.group(
      {
        product_id: [null, Validators.required],
        quantity: [1, [Validators.required, Validators.min(0.001)]],
        purchase_price: [0, [Validators.required, Validators.min(0)]],
        serial_numbers: this.fb.array([])
      },
      { validators: [this.serialNumberValidator.bind(this)] }
    );
  }

  addLineItem(): void {
    const lineItem = this.createLineItem();
    const newIndex = this.lineItems.length;
    this.lineItems.push(lineItem);
    this.productsPerLine[newIndex] = [...this.products];
    this.setupLineItemSubscriptions(newIndex);
    this.setupProductSearch(newIndex);
  }

  removeLineItem(index: number): void {
    this.lineItems.removeAt(index);
    // Réindexer productsPerLine et productSearchCtrls
    const newProductsPerLine: { [key: number]: Product[] } = {};
    const newSearchCtrls: { [key: number]: FormControl } = {};
    for (let i = 0; i < this.lineItems.length; i++) {
      const oldIdx = i < index ? i : i + 1;
      newProductsPerLine[i] = this.productsPerLine[oldIdx] ?? [
        ...this.products
      ];
      newSearchCtrls[i] =
        this.productSearchCtrls[oldIdx] ?? new FormControl('');
    }
    this.productsPerLine = newProductsPerLine;
    this.productSearchCtrls = newSearchCtrls;
  }

  setupLineItemSubscriptions(lineItemIndex: number): void {
    const lineItem = this.lineItems.at(lineItemIndex);

    lineItem
      .get('quantity')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.onQuantityChange(lineItemIndex));

    lineItem
      .get('product_id')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((productId) => {
        if (productId && this.isProductSelected(productId, lineItemIndex)) {
          lineItem.get('product_id')?.setValue(null, { emitEvent: false });
          this.notificationService.error('Ce produit a déjà été sélectionné');
        } else {
          this.onProductChange(lineItemIndex);
        }
      });
  }

  // ─── NUMÉROS DE SÉRIE ────────────────────────────────────────────────────

  getSerialNumbers(lineItemIndex: number): FormArray {
    return this.lineItems.at(lineItemIndex).get('serial_numbers') as FormArray;
  }

  addSerialNumber(lineItemIndex: number): void {
    this.getSerialNumbers(lineItemIndex).push(
      this.fb.control('', [
        Validators.required,
        this.uniqueSerialNumberValidator(lineItemIndex)
      ])
    );
  }

  removeSerialNumber(lineItemIndex: number, serialIndex: number): void {
    this.getSerialNumbers(lineItemIndex).removeAt(serialIndex);
    // Retrigger validation sur les numéros restants
    this.getSerialNumbers(lineItemIndex).controls.forEach((ctrl) =>
      ctrl.updateValueAndValidity()
    );
  }

  /**
   * Validateur qui vérifie que la valeur est unique dans le FormArray de la ligne.
   */
  uniqueSerialNumberValidator(lineItemIndex: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value?.trim();
      if (!value) return null;
      const allSerials = this.getSerialNumbers(lineItemIndex);
      if (!allSerials) return null;
      const duplicates = allSerials.controls.filter(
        (c) => c !== control && c.value?.trim() === value
      );
      return duplicates.length > 0 ? { duplicateSerial: true } : null;
    };
  }

  /**
   * Déclenché à la saisie pour revalider tous les champs de la ligne.
   */
  onSerialNumberChange(lineItemIndex: number): void {
    const serials = this.getSerialNumbers(lineItemIndex);
    serials.controls.forEach((ctrl) =>
      ctrl.updateValueAndValidity({ emitEvent: false })
    );
  }

  serialNumberValidator(control: AbstractControl): ValidationErrors | null {
    const productId = control.get('product_id')?.value;
    const quantity = control.get('quantity')?.value;
    const serialNumbers = control.get('serial_numbers') as FormArray;
    // On récupère les produits depuis le state courant
    const product = this.products.find((p) => p.id === productId);
    const isIntegerQuantity = this.integerPattern.test(String(quantity ?? ''));

    if (!this.usesMeasurements && !isIntegerQuantity) {
      return { quantityMustBeInteger: true };
    }

    if (product?.require_serial_number && !isIntegerQuantity) {
      return { quantityMustBeIntegerForSerial: true };
    }

    if (product?.require_serial_number && serialNumbers.length !== quantity) {
      return { serialNumbersMismatch: true };
    }
    return null;
  }

  // ─── CHANGEMENTS PRODUIT / QUANTITÉ ─────────────────────────────────────

  onProductChange(lineItemIndex: number): void {
    const lineItem = this.lineItems.at(lineItemIndex);
    const productId = lineItem.get('product_id')?.value;
    const allProducts = this.getProductsForLine(lineItemIndex);
    const product = allProducts.find((p) => p.id === productId);
    const serialNumbers = this.getSerialNumbers(lineItemIndex);

    while (serialNumbers.length > 0) serialNumbers.removeAt(0);

    if (product?.require_serial_number) {
      const qty = Math.max(0, Math.trunc(Number(lineItem.get('quantity')?.value || 1)));
      for (let i = 0; i < qty; i++) this.addSerialNumber(lineItemIndex);
    }
    lineItem.updateValueAndValidity();
  }

  onQuantityChange(lineItemIndex: number): void {
    const lineItem = this.lineItems.at(lineItemIndex);
    const productId = lineItem.get('product_id')?.value;
    const allProducts = this.getProductsForLine(lineItemIndex);
    const product = allProducts.find((p) => p.id === productId);
    const quantity = lineItem.get('quantity')?.value;

    if (product?.require_serial_number) {
      const serialNumbers = this.getSerialNumbers(lineItemIndex);
      const current = serialNumbers.length;
      const target = Math.max(0, Math.trunc(Number(quantity || 0)));
      if (target > current) {
        for (let i = current; i < target; i++)
          this.addSerialNumber(lineItemIndex);
      } else {
        for (let i = current - 1; i >= target; i--)
          this.removeSerialNumber(lineItemIndex, i);
      }
    }
    lineItem.updateValueAndValidity();
  }

  isProductSelected(productId: number, currentLineItemIndex: number): boolean {
    for (let i = 0; i < this.lineItems.length; i++) {
      if (i !== currentLineItemIndex) {
        if (this.lineItems.at(i).get('product_id')?.value === productId)
          return true;
      }
    }
    return false;
  }

  // ─── CALCULS ─────────────────────────────────────────────────────────────

  getLineTotal(index: number): number {
    const lineItem = this.lineItems.at(index);
    const qty = lineItem.get('quantity')?.value || 0;
    const price = lineItem.get('purchase_price')?.value || 0;
    return qty * price;
  }

  getTotalAmount(): number {
    return this.lineItems.controls.reduce(
      (sum, _, i) => sum + this.getLineTotal(i),
      0
    );
  }

  getProductName(index: number): string {
    const productId = this.lineItems.at(index).get('product_id')?.value;
    const allProducts = this.getProductsForLine(index);
    return (
      allProducts.find((p) => p.id === productId)?.name ??
      `Produit ${index + 1}`
    );
  }

  requiresSerial(index: number): boolean {
    const productId = this.lineItems.at(index).get('product_id')?.value;
    const allProducts = this.getProductsForLine(index);
    return !!allProducts.find((p) => p.id === productId)?.require_serial_number;
  }

  // ─── CHARGEMENT INITIAL ──────────────────────────────────────────────────

  getProducts(): void {
    this.productService.list(this.store.id, null).subscribe({
      next: (response) => {
        this.products = response.data;
        // Remplir les listes par ligne si déjà initialisées
        Object.keys(this.productsPerLine).forEach((k) => {
          if (this.productsPerLine[+k].length === 0) {
            this.productsPerLine[+k] = [...this.products];
          }
        });
      }
    });
  }

  getSuppliers(): void {
    this.supplierService.getSupplier(this.store.id).subscribe({
      next: (response) => (this.suppliers = response.data)
    });
  }

  populateFormWithProcurementData(): void {
    if (!this.procurementToUpdate) return;

    this.procurementForm.patchValue({
      supplier_id: this.procurementToUpdate.supplier.id,
      status: this.procurementToUpdate.status
    });

    this.procurementToUpdate.line_items.forEach((lineItem, index) => {
      const group = this.createLineItem();
      this.lineItems.push(group);
      this.productsPerLine[index] = [...this.products];
      this.setupLineItemSubscriptions(index);
      this.setupProductSearch(index);

      group.patchValue({
        product_id: lineItem.product.id,
          quantity: parseFloat(lineItem.quantity),
        purchase_price: lineItem.purchase_price
      });

      if (lineItem.serial_numbers?.length > 0) {
        const sa = this.getSerialNumbers(index);
        lineItem.serial_numbers.forEach((sn) =>
          sa.push(
            this.fb.control(sn, [
              Validators.required,
              this.uniqueSerialNumberValidator(index)
            ])
          )
        );
      }
    });
  }

  // ─── SAUVEGARDE ──────────────────────────────────────────────────────────

  save(): void {
    if (this.procurementForm.invalid) {
      this.procurementForm.markAllAsTouched();
      this.notificationService.error(
        'Veuillez corriger les erreurs du formulaire'
      );
      return;
    }

    this.isSubmitting = true;
    const fv = this.procurementForm.value;

    const data: AddProcurement = {
      store_id: this.store.id,
      supplier_id: fv.supplier_id,
      status: fv.status || 'pending',
      line_items: fv.line_items.map(
        (item: {
          product_id: number;
          quantity: number;
          purchase_price: number;
          serial_numbers: string[];
        }) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          purchase_price: item.purchase_price,
          serial_numbers: item.serial_numbers?.length
            ? item.serial_numbers
            : undefined
        })
      )
    };

    const request$ =
      this.isUpdateMode && this.procurementToUpdate
        ? this.procurementService.update(this.procurementToUpdate.id, data)
        : this.procurementService.add(data);

    request$.subscribe({
      next: (response) => {
        this.notificationService.success(response.message);
        this.router.navigate(['index/manager/procurement/list'], {
          state: { store: this.store, company: this.company }
        });
      },
      error: (error) => {
        this.notificationService.error(error.error.message);
        this.isSubmitting = false;
      }
    });
  }

  goBack(): void {
    if (this.isOwner) {
      navigateStoreBack(this.router, {
        isOwner: true,
        store: this.store,
        company: this.company
      });
      return;
    }
    navigateToProcurementList(this.router, this.store, this.company);
  }
}
