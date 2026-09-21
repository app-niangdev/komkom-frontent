import { NgIf, NgFor, CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { CategoryService } from 'src/app/auth/services/category.service';
import { NotificationService } from 'src/app/auth/services/Notification.service';
import { ProductService } from 'src/app/auth/services/product.service';
import { Category } from 'src/app/interfaces/Category';
import { Company } from 'src/app/interfaces/Company';
import { Product } from 'src/app/interfaces/Product';
import { Store } from 'src/app/interfaces/Store';
import { UploadFileComponent } from 'src/app/layouts/components/upload-file/upload-file.component';

@Component({
  selector: 'vex-product-add-update',
  templateUrl: './product-add-update.component.html',
  styleUrls: ['./product-add-update.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    NgIf,
    NgFor,
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
    CommonModule,
    MatProgressBarModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    UploadFileComponent
  ]
})
export class ProductAddUpdateComponent implements OnInit {
  // @ViewChild(UploadFile) uploadFileComponent!: UploadFile;

  isSubmitting: boolean = false;
  isUpdateMode: boolean = false;
  existErrorMessage: boolean = false;
  errorMessage!: string;
  uploadError: string = '';
  title: string = '';
  form!: FormGroup;
  productUpdate!: Product;
  store!: Store;
  company!: Company;
  categories: Category[] = [];
  readonly defaultUnitWithoutMeasurements = 'piece';

  // Gestion de l'image
  imagePreview: string | null = null;
  selectedImage: File | null = null;
  selectedImageUrl: string | null = null;

  constructor(
    private categoryService: CategoryService,
    private productService: ProductService,
    private fb: FormBuilder,
    private router: Router,
    private notificationService: NotificationService,
    public dialogRef: MatDialogRef<ProductAddUpdateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.store = data.store;
    this.title = 'Ajouter un produit';
    if (data.isUpdateMode && data.productUpdate) {
      // Ne pas écraser this.store s'il n'est pas dans history.state
      if (history.state.store) {
        this.store = history.state.store;
      }
      if (history.state.company) {
        this.company = history.state.company;
      }
      this.productUpdate = data.productUpdate;
      this.title = 'Modifier le produit';
      this.isUpdateMode = true;
    }
    this.initializeForms();
  }

  ngOnInit(): void {
    // Charger les catégories seulement si le store est disponible
    if (this.store && this.store.id) {
      this.loadCategories();
    }
    this.initializeFormsWithData();
  }

  initializeForms(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      category_id: ['', [Validators.required]],
      description: ['', [Validators.maxLength(500)]],
      require_serial_number: [false],
      alert_threshold: [0, [Validators.min(0)]],
      unit_of_measures: this.fb.array([this.createUnitFormGroup(true)]),
      base_unit: ['unite'],
      unit_price: [0, [Validators.min(0)]]
    });

    // ✅ Désactiver le FormArray si le store n'utilise pas les mesures
    if (!this.usesMeasurements) {
      this.unitOfMeasures.disable();
    }
  }
  // initializeForms(): void {
  //   this.form = this.fb.group({
  //     name: ['', [Validators.required, Validators.maxLength(255)]],
  //     category_id: ['', [Validators.required]],
  //     description: ['', [Validators.maxLength(500)]],
  //     require_serial_number: [false],
  //     alert_threshold: [0, [Validators.min(0)]],
  //     unit_of_measures: this.fb.array([this.createUnitFormGroup(true)]),
  //     base_unit: ['unite'],
  //     unit_price: [0, [Validators.min(0)]]
  //   });
  // }

  get usesMeasurements(): boolean {
    return this.store?.uses_measurements !== false;
  }

  createUnitFormGroup(isBaseUnit: boolean = false): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      price: [0, [Validators.required, Validators.min(0)]],
      conversion_factor: [1, [Validators.required, Validators.min(0.001)]],
      is_base_unit: [isBaseUnit]
    });
  }

  get unitOfMeasures(): FormArray {
    return this.form.get('unit_of_measures') as FormArray;
  }

  addUnit(): void {
    this.unitOfMeasures.push(this.createUnitFormGroup(false));
  }

  removeUnit(index: number): void {
    const unitToRemove = this.unitOfMeasures.at(index);
    if (unitToRemove.get('is_base_unit')?.value) {
      this.notificationService.error("Impossible de supprimer l'unité de base");
      return;
    }
    this.unitOfMeasures.removeAt(index);
  }

  setBaseUnit(index: number): void {
    // Désélectionner toutes les autres unités comme unité de base
    this.unitOfMeasures.controls.forEach((unit, i) => {
      unit.get('is_base_unit')?.setValue(i === index);
    });
  }

  hasNoBaseUnit(): boolean {
    if (!this.usesMeasurements) {
      return false;
    }

    return !this.unitOfMeasures.controls.some(
      (unit) => unit.get('is_base_unit')?.value
    );
  }

  hasDuplicateUnitNames(): boolean {
    if (!this.usesMeasurements) {
      return false;
    }

    const unitNames = this.unitOfMeasures.controls.map(
      (unit) => unit.get('name')?.value?.toLowerCase().trim()
    );
    const uniqueNames = new Set(unitNames.filter((name) => name));
    return uniqueNames.size !== unitNames.filter((name) => name).length;
  }

  loadCategories(): void {
    this.categoryService.list(this.store.id).subscribe({
      next: (response) => {
        this.categories = response.data;
      },
      error: (error) => {
        this.notificationService.error(
          'Erreur lors du chargement des catégories'
        );
        console.log(error);
      }
    });
  }

  initializeFormsWithData(): void {
    if (this.isUpdateMode && this.productUpdate) {
      // Vider le formArray des unités
      while (this.unitOfMeasures.length !== 0) {
        this.unitOfMeasures.removeAt(0);
      }

      // Ajouter les unités existantes
      if (this.productUpdate.unit_of_measures) {
        this.productUpdate.unit_of_measures.forEach((unit) => {
          this.unitOfMeasures.push(
            this.fb.group({
              name: [
                unit.name,
                [Validators.required, Validators.maxLength(50)]
              ],
              price: [unit.price, [Validators.required, Validators.min(0)]],
              conversion_factor: [
                unit.conversion_factor,
                [Validators.required, Validators.min(0.001)]
              ],
              is_base_unit: [unit.is_base_unit]
            })
          );
        });
      }

      // Afficher l'image existante si disponible
      // Utiliser image_url en priorité (URL complète), sinon image
      const imageUrl = this.productUpdate.image_url || this.productUpdate.image;
      if (imageUrl) {
        this.imagePreview = imageUrl;
        this.selectedImage = null;
      }

      this.form.patchValue({
        name: this.productUpdate.name || '',
        category_id: this.productUpdate.category?.id || '',
        description: this.productUpdate.description || '',
        require_serial_number:
          this.productUpdate.require_serial_number || false,
        alert_threshold: this.productUpdate.alert_threshold || 0,
        unit_price:
          this.productUpdate.unit_of_measures?.find((u) => u.is_base_unit)
            ?.price ?? 0
      });
    }
  }

  save(): void {
    if (
      this.form.invalid ||
      this.hasNoBaseUnit() ||
      this.hasDuplicateUnitNames()
    ) {
      this.form.markAllAsTouched();
      this.unitOfMeasures.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    // Préparer les données avec l'image
    const formData = new FormData();
    const productData = this.form.value;

    // Ajouter les champs du formulaire
    Object.keys(productData).forEach((key) => {
      if (
        !this.usesMeasurements &&
        (key === 'unit_of_measures' || key === 'base_unit')
      ) {
        return;
      }

      if (key === 'unit_of_measures') {
        formData.append(key, JSON.stringify(productData[key]));
      } else if (key === 'require_serial_number') {
        formData.append(key, productData[key] ? '1' : '0');
      } else {
        formData.append(key, productData[key]);
      }
    });

    if (!this.usesMeasurements) {
      formData.append('base_unit', this.defaultUnitWithoutMeasurements);
      // ✅ Récupérer unit_price via getRawValue() car le champ peut être disabled
      formData.append('unit_price', this.form.getRawValue().unit_price);
    }

    if (!this.usesMeasurements) {
      formData.append('base_unit', this.defaultUnitWithoutMeasurements);
    }
    // Ajouter l'image (fichier uploadé ou lien URL)
    if (this.selectedImage) {
      formData.append('image', this.selectedImage);
    } else if (this.selectedImageUrl) {
      formData.append('image_url', this.selectedImageUrl);
    }

    const store_id = this.store.id;
    formData.append('store_id', store_id.toString());

    if (!this.isUpdateMode) {
      this.productService.add(formData).subscribe({
        next: (response) => {
          this.notificationService.success(response.message);
          this.isSubmitting = false;
          this.resetForm();
          this.close();
        },
        error: (error) => {
          this.notificationService.error(error.error.message);
          this.isSubmitting = false;
          this.close();
        }
      });
    } else {
      formData.append('_method', 'PUT');
      this.productService.update(this.productUpdate.id, formData).subscribe({
        next: (response) => {
          this.notificationService.success(response.message);
          this.isSubmitting = false;
          this.resetForm();
          this.close();
        },
        error: (error) => {
          this.notificationService.error(error.error.message);
          this.isSubmitting = false;
          this.close();
        }
      });
    }
  }

  close() {
    this.dialogRef.close(true);
  }

  private resetForm() {
    // Réinitialiser le formulaire
    this.form.reset();

    // Vider le FormArray des unités
    while (this.unitOfMeasures.length !== 0) {
      this.unitOfMeasures.removeAt(0);
    }

    // Ajouter une unité de base par défaut
    this.unitOfMeasures.push(this.createUnitFormGroup(true));

    // Réinitialiser les valeurs par défaut du formulaire
    this.form.patchValue({
      require_serial_number: false,
      alert_threshold: 0
    });

    // Réinitialiser l'image
    this.imagePreview = null;
    this.selectedImage = null;
    this.selectedImageUrl = null;

    // // Réinitialiser le component upload-file
    // if (this.uploadFileComponent) {
    //   this.uploadFileComponent.reset();
    // }
  }

  goBack() {
    this.router.navigate(['/index/manager/product/list'], {
      state: { store: this.store, company: this.company }
    });
  }

  onFileUpload(file: File): void {
    this.selectedImage = file;
    this.selectedImageUrl = null;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagePreview = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  onImageUrlProvided(url: string): void {
    this.selectedImageUrl = url;
    this.selectedImage = null;
    this.imagePreview = url;
  }

  onFileRemove(): void {
    this.selectedImage = null;
    this.selectedImageUrl = null;
    if (this.isUpdateMode && this.productUpdate?.image_url) {
      this.imagePreview = this.productUpdate.image_url;
    } else {
      this.imagePreview = null;
    }
  }
}
