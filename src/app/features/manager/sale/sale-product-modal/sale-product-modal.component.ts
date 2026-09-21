import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { Product, SerialNumber, UnitOfMeasures } from 'src/app/interfaces/Product';
import { QuantityFormatPipe } from 'src/app/pipes/quantity-format.pipe';
import { SaleProductModalData } from 'src/app/interfaces/Sale';

@Component({
  selector: 'vex-sale-product-modal',
  templateUrl: './sale-product-modal.component.html',
  styleUrls: ['./sale-product-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSnackBarModule,
    MatCheckboxModule,
    MatSelectModule,
    QuantityFormatPipe
  ]
})
export class SaleProductModalComponent implements OnInit {
  productForm!: FormGroup;
  availableSerialNumbers: SerialNumber[] = [];
  selectedUnitOfMeasure!: UnitOfMeasures;

  get usesMeasurements(): boolean {
    return this.data?.uses_measurements !== false;
  }

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: SaleProductModalData,
    private dialogRef: MatDialogRef<SaleProductModalComponent>
  ) {}

  ngOnInit(): void {
    // Déterminer l'unité de mesure initiale
    const initialUnitId = this.data.selected_unit_of_measure_id ||
                          this.data.product.unit_of_measures?.find(u => u.is_base_unit)?.id ||
                          this.data.product.unit_of_measures?.[0]?.id;

    this.selectedUnitOfMeasure = this.data.product.unit_of_measures?.find(u => u.id === initialUnitId) ||
                                  this.data.product.unit_of_measures?.[0];

    const maxStock = this.data.product.base_unit_quantity || this.data.product.stock_quantity || 999999;

    // Convertir les serial_numbers strings en IDs pour l'initialisation
    const initialSelectedIds = this.data.serial_numbers?.map(sn => {
      const found = this.data.product.serial_numbers?.find(s => s.serial_number === sn);
      return found?.id;
    }).filter(id => id !== undefined) || [];

    this.productForm = this.fb.group({
      quantity: [this.data.quantity, [Validators.required, Validators.min(this.usesMeasurements ? 0.001 : 1)]],
      unit_price_at_sale: [this.data.unit_price_at_sale, [Validators.required, Validators.min(0)]],
      selected_serial_numbers: [initialSelectedIds],
      unit_of_measure_id: [initialUnitId, [Validators.required]]
    });

    // Si le produit nécessite des numéros de série
    if (this.data.product.require_serial_number) {
      this.availableSerialNumbers = this.data.product.serial_numbers || [];

      // Ajouter validation pour les numéros de série
      this.productForm.get('selected_serial_numbers')?.setValidators([
        Validators.required,
        (control) => {
          const quantity = this.productForm?.get('quantity')?.value || 0;
          const selectedIds = control.value || [];
          return selectedIds.length === quantity ? null : { mismatchQuantity: true };
        }
      ]);
    }

    // Observer les changements de quantité
    this.productForm.get('quantity')?.valueChanges.subscribe(() => {
      if (this.data.product.require_serial_number) {
        this.productForm.get('selected_serial_numbers')?.updateValueAndValidity();
      }
    });

    // Observer les changements d'unité de mesure
    this.productForm.get('unit_of_measure_id')?.valueChanges.subscribe((unitId) => {
      this.onUnitOfMeasureChange(unitId);
    });
  }

  onUnitOfMeasureChange(unitId: number): void {
    const unit = this.data.product.unit_of_measures?.find(u => u.id === unitId);
    if (unit) {
      this.selectedUnitOfMeasure = unit;
      // Mettre à jour le prix selon l'unité de mesure sélectionnée
      this.productForm.get('unit_price_at_sale')?.setValue(unit.price);
    }
  }

  getMaxQuantityForSelectedUnit(): number {
    const baseStock = this.data.product.base_unit_quantity || this.data.product.stock_quantity || 0;
    if (!this.selectedUnitOfMeasure) return baseStock;

    // Calculer la quantité maximale disponible dans l'unité sélectionnée
    // base_unit_quantity / conversion_factor = quantité disponible dans l'unité sélectionnée
    return Math.floor(baseStock / this.selectedUnitOfMeasure.conversion_factor);
  }

  getBaseUnitQuantity(): number {
    const quantity = this.productForm.get('quantity')?.value || 0;
    if (!this.selectedUnitOfMeasure) return quantity;

    // Convertir la quantité sélectionnée en quantité de base
    return quantity * this.selectedUnitOfMeasure.conversion_factor;
  }

  get selectedSerialNumbers(): number[] {
    return this.productForm.get('selected_serial_numbers')?.value || [];
  }

  getSelectedSerialNumbersDetails(): SerialNumber[] {
    const selectedIds = this.selectedSerialNumbers;
    return this.availableSerialNumbers.filter(sn => selectedIds.includes(sn.id));
  }

  isSerialNumberDisabled(serialNumberId: number): boolean {
    const quantity = this.productForm.get('quantity')?.value || 0;
    const selectedIds = this.selectedSerialNumbers;

    // Si le numéro de série est déjà sélectionné, il ne doit pas être désactivé
    if (selectedIds.includes(serialNumberId)) {
      return false;
    }

    // Si la quantité maximum est atteinte, désactiver les options non sélectionnées
    return selectedIds.length >= quantity;
  }

  getSubtotal(): number {
    const quantity = this.productForm.get('quantity')?.value || 0;
    const price = this.productForm.get('unit_price_at_sale')?.value || 0;
    return quantity * price;
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      let errorMessage = 'Veuillez remplir tous les champs requis';

      if (this.productForm.get('selected_serial_numbers')?.hasError('mismatchQuantity')) {
        const quantity = this.productForm.get('quantity')?.value || 0;
        const selectedCount = this.selectedSerialNumbers.length;
        errorMessage = `Vous devez sélectionner exactement ${quantity} numéro(s) de série (${selectedCount} sélectionné(s))`;
      }

      this.snackBar.open(errorMessage, 'Fermer', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    // Vérifier la quantité disponible en base_unit
    const baseQuantityNeeded = this.getBaseUnitQuantity();
    const maxStock = this.data.product.base_unit_quantity || this.data.product.stock_quantity || 0;
    const quantity = Number(this.productForm.get('quantity')?.value || 0);

    if (!this.usesMeasurements && !Number.isInteger(quantity)) {
      this.snackBar.open('Cette boutique n autorise que des quantites entieres.', 'Fermer', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    if (this.data.product.require_serial_number && !Number.isInteger(quantity)) {
      this.snackBar.open(
        'Les produits avec numero de serie exigent des quantites entieres.',
        'Fermer',
        {
          duration: 3000,
          panelClass: ['error-snackbar']
        }
      );
      return;
    }

    if (baseQuantityNeeded > maxStock) {
      const maxInSelectedUnit = this.getMaxQuantityForSelectedUnit();
      this.snackBar.open(
        `Stock insuffisant. Stock disponible: ${maxInSelectedUnit} ${this.selectedUnitOfMeasure?.name || ''}`,
        'Fermer',
        {
          duration: 3000,
          panelClass: ['error-snackbar']
        }
      );
      return;
    }

    // Convertir les IDs en serial_numbers strings
    const selectedSerialNumberStrings = this.data.product.require_serial_number
      ? this.selectedSerialNumbers.map(id => {
          const found = this.availableSerialNumbers.find(sn => sn.id === id);
          return found?.serial_number || '';
        }).filter(sn => sn !== '')
      : [];

    const result = {
      quantity: this.productForm.get('quantity')?.value,
      unit_price_at_sale: this.productForm.get('unit_price_at_sale')?.value,
      serial_numbers: selectedSerialNumberStrings,
      unit_of_measure_id: this.productForm.get('unit_of_measure_id')?.value,
      base_unit_quantity: baseQuantityNeeded
    };

    this.dialogRef.close(result);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
