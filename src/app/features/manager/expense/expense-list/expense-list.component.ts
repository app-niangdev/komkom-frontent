import {
  NgIf,
  NgFor,
  NgClass,
  CommonModule,
  DatePipe,
  registerLocaleData
} from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  Input,
  LOCALE_ID,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  ReactiveFormsModule,
  FormsModule,
  UntypedFormControl,
  FormControl
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent
} from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { fadeInRight400ms } from '@vex/animations/fade-in-right.animation';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { scaleIn400ms } from '@vex/animations/scale-in.animation';
import { stagger80ms } from '@vex/animations/stagger.animation';
import { VexPageLayoutContentDirective } from '@vex/components/vex-page-layout/vex-page-layout-content.directive';
import { VexPageLayoutComponent } from '@vex/components/vex-page-layout/vex-page-layout.component';
import { TableColumn } from '@vex/interfaces/table-column.interface';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { AuthService } from 'src/app/auth/services/auth.service';
import { Company } from 'src/app/interfaces/Company';
import { Store } from 'src/app/interfaces/Store';
import { Supplier } from 'src/app/interfaces/Supplier';
import {
  PaginationMeta,
  initialPaginationMeta
} from 'src/app/response-type/Type';
import Swal from 'sweetalert2';
import { Expense, ResponseExpense } from 'src/app/interfaces/Expense';
import { ExpenseService } from 'src/app/auth/services/expense.service';
import { ExpenseAddUpdateComponent } from '../expense-add-update/expense-add-update.component';
import localeFr from '@angular/common/locales/fr';
import { IntegerSeparatorPipe } from 'src/app/pipes/integer-separator.pipe';
registerLocaleData(localeFr, 'fr');
import { Location } from '@angular/common';
import { ExportService } from 'src/app/auth/services/export.service';
import { StoreHeaderComponent } from 'src/app/features/store-header/store-header.component';

@Component({
  selector: 'vex-expense-list',
  templateUrl: './expense-list.component.html',
  styleUrls: ['./expense-list.component.scss'],
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
    NgClass,
    MatPaginatorModule,
    FormsModule,
    MatDialogModule,
    MatInputModule,
    MatSnackBarModule,
    CommonModule,
    MatSlideToggleModule,
    MatIconModule,
    IntegerSeparatorPipe,
    MatDatepickerModule,
    MatFormFieldModule,
    StoreHeaderComponent
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'fr' }, DatePipe]
})
export class ExpenseListComponent implements OnInit {
  store!: Store;
  company: Company | null = null;
  searchCtrl = new UntypedFormControl();
  expenses: Expense[] = [];
  meta: PaginationMeta = { ...initialPaginationMeta };
  searchTerm: string = '';
  dataSource!: MatTableDataSource<Expense>;
  isLoading = true;
  expensesResponse!: ResponseExpense;

  // Form controls pour les dates d'export
  startDateControl = new FormControl<Date | null>(null);
  endDateControl = new FormControl<Date | null>(null);

  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;
  layoutCtrl = new UntypedFormControl('boxed');

  @Input()
  columns: TableColumn<Supplier>[] = [
    { label: '#', property: 'icon', type: 'image', visible: true },
    {
      label: 'Titre',
      property: 'title',
      type: 'text',
      visible: true,
      cssClasses: ['font-medium']
    },
    {
      label: 'Date',
      property: 'expense_date',
      type: 'text',
      visible: true,
      cssClasses: ['font-medium']
    },
    {
      label: 'Description',
      property: 'description',
      type: 'text',
      visible: true,
      cssClasses: ['text-secondary', 'font-medium']
    },
    {
      label: 'Montant',
      property: 'amount',
      type: 'text',
      visible: true
    },
    { label: 'Actions', property: 'actions', type: 'button', visible: true }
  ];

  constructor(
    private authService: AuthService,
    public dialog: MatDialog,
    private expenseService: ExpenseService,
    private cd: ChangeDetectorRef,
    private location: Location,
    private exportService: ExportService
  ) {}

  get visibleColumns() {
    return this.columns
      .filter((column) => column.visible)
      .map((column) => column.property);
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
    this.loadExpenses();
    this.initSearch();
    this.isLoading = false;
  }

  private initSearch(): void {
    this.searchCtrl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((searchTerm) =>
          this.expenseService.list(this.store.id, searchTerm)
        )
      )
      .subscribe((response) => {
        this.assignData(response);
      });
  }

  loadExpenses() {
    this.expenseService.list(this.store.id).subscribe({
      next: (response) => {
        this.assignData(response);
      }
    });
  }

  goBack() {
    this.location.back();
  }

  assignData(data: ResponseExpense) {
    this.expensesResponse = data;
    this.expenses = data.data;
    this.meta = data.meta;
    this.dataSource = new MatTableDataSource<Expense>(this.expenses);
  }

  pageEvent(page: PageEvent) {
    this.meta.per_page = page.pageSize;
    this.meta.current_page = page.pageIndex + 1;
    this.expenseService
      .list(this.store.id, '', this.meta.current_page, this.meta.per_page)
      .subscribe({
        next: (response) => {
          this.assignData(response);
        }
      });
  }

  toggleColumnVisibility(column: TableColumn<Supplier>, event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();
    column.visible = !column.visible;
  }

  add() {
    const dialogRef = this.dialog.open(ExpenseAddUpdateComponent, {
      width: '900px',
      disableClose: true,
      data: {
        isEditMode: false,
        store: this.store
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadExpenses();
      }
    });
  }

  update(expense: Expense) {
    const dialogRef = this.dialog.open(ExpenseAddUpdateComponent, {
      width: '1000px',
      disableClose: true,
      data: {
        isEditMode: true,
        expense: expense,
        store: this.store
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadExpenses();
      }
    });
  }

  delete(expense: Expense) {
    this.cd.detectChanges();
    Swal.fire({
      title: 'Confirmation',
      text: `Voulez-vous vraiment supprimer cette dépense "${expense.title}" ?`,
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

        this.expenseService.delete(expense.id).subscribe({
          next: (response) => {
            Swal.fire({
              icon: 'success',
              title: 'Supprimé !',
              text:
                response.message || 'La dépense a été supprimée avec succès.',
              timer: 2000,
              showConfirmButton: false
            });
            this.loadExpenses();
          },
          error: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text:
                error?.message ||
                'Une erreur est survenue lors de la suppression.',
              confirmButtonColor: '#d33'
            });
          }
        });
      }
    });
  }

  /**
   * Formate une date au format YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Exporte les dépenses en PDF
   */
  exportToPDF(): void {
    const startDate = this.startDateControl.value;
    const endDate = this.endDateControl.value;

    if (!startDate) {
      Swal.fire({
        icon: 'warning',
        title: 'Attention',
        text: 'Veuillez sélectionner au moins une date de début.',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    const filters = {
      start_date: this.formatDate(startDate),
      end_date: endDate ? this.formatDate(endDate) : undefined
    };

    Swal.fire({
      title: 'Génération du PDF...',
      text: 'Veuillez patienter',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.expenseService.listForExport(this.store.id, filters).subscribe({
      next: (response) => {
        Swal.close();
        if (response.data && response.data.length > 0) {
          this.exportService.exportExpensesToPDF(response.data, filters);
          Swal.fire({
            icon: 'success',
            title: 'Succès',
            text: 'Le PDF a été généré avec succès.',
            timer: 2000,
            showConfirmButton: false
          });
        } else {
          Swal.fire({
            icon: 'info',
            title: 'Aucune donnée',
            text: 'Aucune dépense trouvée pour la période sélectionnée.',
            confirmButtonColor: '#3085d6'
          });
        }
      },
      error: (error) => {
        Swal.close();
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text:
            error?.message || "Une erreur est survenue lors de l'exportation.",
          confirmButtonColor: '#d33'
        });
      }
    });
  }
}
