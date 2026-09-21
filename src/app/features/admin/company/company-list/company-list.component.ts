import { NgIf, NgFor, CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule, UntypedFormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
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
import { ActivatedRoute, Router } from '@angular/router';
import { fadeInRight400ms } from '@vex/animations/fade-in-right.animation';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { scaleIn400ms } from '@vex/animations/scale-in.animation';
import { stagger80ms } from '@vex/animations/stagger.animation';
import { VexPageLayoutContentDirective } from '@vex/components/vex-page-layout/vex-page-layout-content.directive';
import { TableColumn } from '@vex/interfaces/table-column.interface';
import { ReplaySubject, Observable, debounceTime, distinctUntilChanged, switchMap, map } from 'rxjs';
import { MatDividerModule } from '@angular/material/divider';
import { Company, CompanyResponse } from 'src/app/interfaces/Company';
import { initialPaginationMeta, PaginationMeta } from 'src/app/response-type/Type';
import { CompanyService } from 'src/app/auth/services/company.service';
import { A11yModule } from "@angular/cdk/a11y";
@Component({
  selector: 'vex-company-list',
  templateUrl: './company-list.component.html',
  styleUrls: ['./company-list.component.scss'],
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
    MatPaginatorModule,
    FormsModule,
    MatDialogModule,
    MatInputModule,
    MatSnackBarModule,
    CommonModule,
    MatSlideToggleModule,
    MatDividerModule,
    A11yModule
],
})
export class CompanyListComponent implements OnInit {
  selectedCategory: string | null = null;
  layoutCtrl = new UntypedFormControl('boxed');
  subject$: ReplaySubject<Company[]> = new ReplaySubject<Company[]>(1);
  data$: Observable<CompanyResponse> = new Observable<CompanyResponse>();
  companies: Company[] = [];
  nb_companies: number = 0;
  searchCtrl = new UntypedFormControl();
  meta: PaginationMeta = { ...initialPaginationMeta };

  constructor(
    public dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private companyService: CompanyService,
    private router: Router,
  )
  {
    this.searchCtrl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((searchTerm) =>
          this.companyService.getCompanies(searchTerm, 1, 10, '')
        )
      )
      .subscribe((response) => {
        this.assignData(response);
      });
  }

  getData() {
    this.data$ = this.activatedRoute.data.pipe(
      map((data) => {
        return data['companies'];
      })
    );
    if (this.data$) {
      this.data$.subscribe((response) => {
        this.assignData(response);
      });
    }
  }

  ngOnInit() {
    this.getData();
  }

  // Nouveau: Filtrer par catégorie
  // filterByCategory() {
  //   if (this.selectedCategory != null) {
  //     this.productService.getProductSearchPaginator(
  //       '',
  //       this.selectedCategory,
  //       this.meta.current_page,
  //       this.meta.per_page,
  //     ).subscribe({
  //       next: (response) => {
  //         this.nb_product = response.nb_products;
  //         this.assignData(response);
  //       }
  //     });
  //   }else{
  //     this.refreshData(this.searchCtrl.value || '');
  //   }
  // }

  // Nouveau: Réinitialiser les filtres
  resetFilters() {
    this.searchCtrl.setValue('');
    this.selectedCategory = null;
    this.refreshData('');
  }

  getStockBadgeClass(stockQuantity: number, alert_quantity: number): string {
    return stockQuantity > alert_quantity ? "bg-green-500" : "bg-red-500";
  }

  assignData(data: CompanyResponse) {
    this.companies = data.data;
    this.meta = data.meta;
    this.nb_companies = data.meta.total
  }

  // onFilterChange(value: string) {
  //   if (!this.dataSource) {
  //     return;
  //   }
  //   value = value.trim();
  //   value = value.toLowerCase();
  //   this.dataSource.filter = value;
  // }

  toggleColumnVisibility(column: TableColumn<any>, event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();
    column.visible = !column.visible;
  }

  add() {
    this.router.navigate(['/index/admin/company/add'],{ state: { isUpdateMode:false} });
  }

  delete(element: Company) {
  }

  update(company: Company) {
    this.router.navigate(['/index/admin/company/add'],{ state: {company, isUpdateMode:true} });
  }

  disable(company: Company){

  }

  public refreshData(searchTerm: string) {
    this.companyService.getCompanies(
      searchTerm,
      this.meta.current_page,
      this.meta.per_page,
      ''
    ).subscribe({
      next: (response) => {
        this.assignData(response);
      }
    });
  }

  pageEvent(page: PageEvent) {
    this.meta.per_page = page.pageSize;
    this.meta.current_page = page.pageIndex + 1;
      this.companyService.getCompanies('', this.meta.current_page,this.meta.per_page, '').subscribe({
        next: (response) => {
          this.assignData(response);
        }
      });
  }

  goToStore(company:Company){
    this.router.navigate(['/index/admin/company/store'], { state: { company:company } });
  }
}
