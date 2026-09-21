import { Component, Input, OnInit } from '@angular/core';
import {
  ApexOptions,
  VexChartComponent
} from '@vex/components/vex-chart/vex-chart.component';
import { defaultChartOptions } from '@vex/utils/default-chart-options';
import { createDateArray } from '@vex/utils/create-date-array';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { WidgetChartComponent } from '../widget-chart/widget-chart.component';
import { ReportingResponse } from 'src/app/interfaces/ReportinData';
import { ReportingService } from 'src/app/auth/services/reporting.service';

@Component({
  selector: 'vex-widget-large-goal-chart',
  templateUrl: './widget-large-goal-chart.component.html',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, WidgetChartComponent, NgIf]
})
export class WidgetLargeGoalChartComponent implements OnInit {
  reportingData!: ReportingResponse;

  @Input({ required: true }) total!: string;

  /** store_id fourni par le parent (obligatoire pour l'owner qui gère plusieurs boutiques). */
  @Input() storeId?: number;
  // salesRepportData!:SalesData;
  @Input() series: ApexNonAxisChartSeries | ApexAxisChartSeries = [];
  @Input() options: ApexOptions = defaultChartOptions({
    grid: {
      show: true,
      strokeDashArray: 3,
      padding: {
        left: 16
      }
    },
    chart: {
      type: 'line',
      height: 300,
      sparkline: {
        enabled: false
      },
      zoom: {
        enabled: false
      }
    },
    stroke: {
      width: 4
    },
    labels: createDateArray(12),
    xaxis: {
      type: 'datetime',
      labels: {
        show: true
      }
    },
    yaxis: {
      labels: {
        show: true
      }
    }
  });

  constructor(private reportingService: ReportingService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.reportingService.getReportingSale(this.storeId).subscribe({
      next: (response) => {
        this.reportingData = response;
      }
    });
  }
}
