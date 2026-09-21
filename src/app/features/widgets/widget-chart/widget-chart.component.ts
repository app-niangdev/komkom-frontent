import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';

import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexTitleSubtitle
} from 'ng-apexcharts';
import { IntegerSeparatorPipe } from 'src/app/pipes/integer-separator.pipe';
import { ReportingService } from 'src/app/auth/services/reporting.service';
import { InvoiceSummaryItem } from 'src/app/interfaces/ReportinData';


export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  title: ApexTitleSubtitle;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  colors: string[];
};


@Component({
  selector: 'vex-widget-chart',
  templateUrl: './widget-chart.component.html',
  styleUrls: ['./widget-chart.component.scss'],
  standalone:true,
  imports:[
    NgApexchartsModule,
    CommonModule,
  ],
  providers:[IntegerSeparatorPipe]
})
export class WidgetChartComponent implements OnInit{
  // saleResponse!:SalesResponse;
  summary_month!:InvoiceSummaryItem[];
  public chartOptions!: ChartOptions;

  /** store_id fourni par le parent (obligatoire pour l'owner qui gère plusieurs boutiques). */
  @Input() storeId?: number;

  constructor(private integerSeparatorPipe: IntegerSeparatorPipe, private reportService: ReportingService) {}


  ngOnInit(): void {
    this.reportService.getReportingSale(this.storeId).subscribe({

      next: (response) => {
        // this.saleResponse = response;
        const summaryData = response.data.invoiceStats.summary_data;

        // Convertir en tableau si c'est un seul objet (cas custom_direct)
        this.summary_month = Array.isArray(summaryData) ? summaryData : [summaryData];

        this.chartOptions = {
          series: [
            {
              name: 'Montant Total',
              data: this.summary_month.map(m => m.total_amount)
            },
            {
              name: 'Montant Payé',
              data: this.summary_month.map(m => m.total_paid)
            },
            {
              name: 'Montant Non Payé',
              data: this.summary_month.map(m => m.total_unpaid)
            }
          ],
          chart: {
            type: 'bar',
            height: 300,
          },
          colors: ['#007bff', '#28a745', '#dc3545'],
          plotOptions: {
            bar: {
              horizontal: false,
              columnWidth: '65%',
              borderRadius: 4
            },
          },
          dataLabels: {
            enabled: false
          },
          stroke: {
            show: true,
            width: 2,
            colors: ['transparent']
          },
          xaxis: {
            categories: this.summary_month.map(m => m.month || m.period || `${m.start_date} - ${m.end_date}`),
          },
          title: {
            text: 'Résumé mensuel des paiements'
          },
          tooltip: {
            y: {
              formatter: this.formatMontantString.bind(this)
            }
          }
        };
      }
    });
  }

  formatMontantString(val: number): string {
    return this.integerSeparatorPipe.transform(val) + ' FCFA';
  }

}
