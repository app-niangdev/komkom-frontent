import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit
} from '@angular/core';
import {
  ApexOptions,
  VexChartComponent
} from '@vex/components/vex-chart/vex-chart.component';
import { defaultChartOptions } from '@vex/utils/default-chart-options';
import {
  MatBottomSheet,
  MatBottomSheetModule
} from '@angular/material/bottom-sheet';
import { scaleInOutAnimation } from '@vex/animations/scale-in-out.animation';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgClass, NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { IntegerSeparatorPipe } from 'src/app/pipes/integer-separator.pipe';

@Component({
  selector: 'vex-widget-quick-line-chart',
  templateUrl: './widget-quick-line-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [scaleInOutAnimation],
  standalone: true,
  imports: [
    NgClass,
    MatIconModule,
    MatButtonModule,
    MatBottomSheetModule,
    MatCardModule
  ]
})
export class WidgetQuickLineChartComponent implements OnInit {
  @Input({ required: true }) icon!: string;
  @Input({ required: true }) value!: string;
  @Input({ required: true }) label!: string;
  // @Input({ required: false }) data!:SalesData;

  @Input() iconClass?: string;
  @Input() options: ApexOptions = defaultChartOptions({
    chart: {
      type: 'area',
      height: 100
    }
  });
  // @Input() series: ApexNonAxisChartSeries | ApexAxisChartSeries = [];

  showButton: boolean = false;

  constructor(
    private _bottomSheet: MatBottomSheet,
    private route: Router
  ) {}

  ngOnInit() {}

  openSheet(redirect: string) {
    if (redirect == 'customer') {
      this.route.navigate(['index/manager/customers/list']);
    }
    if (redirect == 'supplier') {
      this.route.navigate(['index/manager/suppliers/list']);
    }
    // this._bottomSheet.open(ShareBottomSheetComponent);
  }

  getBardIcons(totalPurchases: number): string {
    let iconCount = 1;
    if (totalPurchases >= 1000000) {
      iconCount = 5;
    } else if (totalPurchases >= 500000) {
      iconCount = 3;
    } else if (totalPurchases >= 250000) {
      iconCount = 2;
    }
    return Array(iconCount)
      .fill('<i class="ri-bard-line" style="color: gold"></i>')
      .join(' ');
  }
}
