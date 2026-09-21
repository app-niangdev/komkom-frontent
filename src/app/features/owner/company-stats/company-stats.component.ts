import { NgIf, DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { WidgetAssistantComponent } from '../../widgets/widget-assistant/widget-assistant.component';
import { WidgetQuickLineChartComponent } from '../../widgets/widget-quick-line-chart/widget-quick-line-chart.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReportingService } from 'src/app/auth/services/reporting.service';
import { ExportService } from 'src/app/auth/services/export.service';
import { ReportingResponse } from 'src/app/interfaces/ReportinData';
import { WidgetLargeGoalChartComponent } from '../../widgets/widget-large-goal-chart/widget-large-goal-chart.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { KomkomPageLoaderComponent } from 'src/app/layouts/components/page-loader/page-loader.component';
import { AuthService } from 'src/app/auth/services/auth.service';
import { Store } from 'src/app/interfaces/Store';
import { IntegerSeparatorPipe } from 'src/app/pipes/integer-separator.pipe';
import { Router } from '@angular/router';
import { OWNER_STORES_ROUTE } from 'src/app/core/utils/store-context.util';

@Component({
  selector: 'vex-company-stats',
  templateUrl: './company-stats.component.html',
  styleUrls: ['./company-stats.component.scss'],
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    WidgetAssistantComponent,
    NgIf,
    DatePipe,
    DecimalPipe,
    WidgetQuickLineChartComponent,
    WidgetLargeGoalChartComponent,
    FormsModule,
    ReactiveFormsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    KomkomPageLoaderComponent,
    IntegerSeparatorPipe
  ]
})
export class CompanyStatsComponent implements OnInit {
  reportingData!: ReportingResponse;
  isLoading = false;
  hideIfSeller: boolean = false;
  // Form controls pour les dates
  startDateControl = new FormControl<Date | null>(null);
  endDateControl = new FormControl<Date | null>(null);

  // Données dynamiques pour le graphique
  chartLabels: string[] = [];
  chartTotalAmounts: number[] = [];
  chartPaidAmounts: number[] = [];
  chartUnpaidAmounts: number[] = [];
  store!: Store;

  constructor(
    private reportingService: ReportingService,
    private exportService: ExportService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.getUserAuth().subscribe({
      next: (response) => {
        const roleName = response.user?.role?.name?.toLowerCase();
        if (roleName === 'seller') {
          this.hideIfSeller = true;
        }
        if (roleName == 'owner') {
          this.store = history.state.store;
          if (this.store) {
            this.loadData();
          } else {
            // Aucune boutique en contexte (F5, accès direct, etc.) :
            // on renvoie l'owner vers la liste des boutiques pour en choisir une.
            this.router.navigate([OWNER_STORES_ROUTE]);
          }
        } else {
          this.loadData();
        }
      },
      error: (err) => {
        console.error("Erreur lors de la récupération de l'utilisateur", err);
      }
    });
  }

  /**
   * Charge les données avec les paramètres optionnels de date
   */
  loadData() {
    this.isLoading = true;
    const params = this.buildQueryParams();
    // Pour les Owners, on passe le store_id. Pour Manager/Seller, le backend le gère automatiquement
    const storeId = this.store?.id;
    this.reportingService.getReportingSale(storeId, params).subscribe({
      next: (response) => {
        this.reportingData = response;
        this.updateChartData();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des données:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Met à jour les données du graphique basé sur invoiceStats
   */
  private updateChartData(): void {
    if (!this.reportingData?.data?.invoiceStats?.summary_data) {
      return;
    }

    const summaryData = this.reportingData.data.invoiceStats.summary_data;

    // Convertir en tableau si c'est un seul objet (cas custom_direct)
    const dataArray = Array.isArray(summaryData) ? summaryData : [summaryData];

    // Extraire les labels (mois ou période) et les données
    this.chartLabels = dataArray.map(
      (item) =>
        item.month || item.period || `${item.start_date} - ${item.end_date}`
    );
    this.chartTotalAmounts = dataArray.map((item) => item.total_amount || 0);
    this.chartPaidAmounts = dataArray.map((item) => item.total_paid || 0);
    this.chartUnpaidAmounts = dataArray.map((item) => item.total_unpaid || 0);

    // Mettre à jour salesSeries avec les vraies données
    this.salesSeries = [
      {
        name: 'Montant Total',
        data: this.chartTotalAmounts
      },
      {
        name: 'Montant Payé',
        data: this.chartPaidAmounts
      },
      {
        name: 'Montant Non Payé',
        data: this.chartUnpaidAmounts
      }
    ];
  }

  /**
   * Construit les paramètres de requête basés sur les dates sélectionnées
   */
  private buildQueryParams():
    | { start_date?: string; end_date?: string; year?: number }
    | undefined {
    const startDate = this.startDateControl.value;
    const endDate = this.endDateControl.value;

    if (!startDate && !endDate) {
      return undefined;
    }

    const params: { start_date?: string; end_date?: string; year?: number } =
      {};

    if (startDate) {
      params.start_date = this.formatDate(startDate);

      // Si seule la date de début est fournie, on peut optionnellement extraire l'année
      if (!endDate) {
        params.year = startDate.getFullYear();
      }
    }

    if (endDate) {
      params.end_date = this.formatDate(endDate);
    }

    return Object.keys(params).length > 0 ? params : undefined;
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
   * Appelée lors du clic sur le bouton Rechercher
   */
  onSearch(): void {
    this.loadData();
  }

  /**
   * Réinitialise les filtres et recharge toutes les données
   */
  resetFilters(): void {
    this.startDateControl.reset();
    this.endDateControl.reset();
    this.loadData();
  }

  /**
   * Exporte les données en PDF
   */
  exportToPDF(): void {
    if (!this.reportingData) {
      return;
    }

    const filters = this.buildQueryParams();
    this.exportService.exportToPDF(this.reportingData, filters);
  }

  /**
   * Exporte les données en Excel
   */
  exportToExcel(): void {
    if (!this.reportingData) {
      return;
    }

    const filters = this.buildQueryParams();
    this.exportService.exportToExcel(this.reportingData, filters);
  }

  salesSeries: ApexAxisChartSeries = [
    {
      name: 'Sales',
      data: [28, 40, 36, 0, 52, 38, 60, 55, 99, 54, 38, 87]
    }
  ];
}
