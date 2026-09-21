import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'komkom-page-loader',
  standalone: true,
  imports: [NgIf],
  templateUrl: './page-loader.component.html',
  styleUrls: ['./page-loader.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KomkomPageLoaderComponent {
  @Input() message = '';
  @Input() compact = false;
}
