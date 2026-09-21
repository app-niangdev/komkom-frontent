import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import { VexPopoverService } from '@vex/components/vex-popover/vex-popover.service';
import { ToolbarUserDropdownComponent } from './toolbar-user-dropdown/toolbar-user-dropdown.component';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { CurrentUserAuth } from 'src/app/response-type/Type';
import { User } from 'src/app/interfaces/User';
import { AuthService } from 'src/app/auth/services/auth.service';

@Component({
  selector: 'vex-toolbar-user',
  templateUrl: './toolbar-user.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatRippleModule, MatIconModule]
})
export class ToolbarUserComponent implements OnInit {
  dropdownOpen: boolean = false;
  userConnet:User | null = null;
  constructor(
    private popover: VexPopoverService,
    private cd: ChangeDetectorRef,
    private authService: AuthService,
  ) {
    // S'abonner aux mises à jour en temps réel
    this.authService.getCurrentUser().subscribe({
      next:(response)=>{
        this.userConnet = response;
        this.cd.markForCheck();
      }
    })
  }

  ngOnInit() {

  }

  showPopover(originRef: HTMLElement) {
    this.dropdownOpen = true;
    this.cd.markForCheck();

    const popoverRef = this.popover.open({
      content: ToolbarUserDropdownComponent,
      origin: originRef,
      offsetY: 12,
      position: [
        {
          originX: 'center',
          originY: 'top',
          overlayX: 'center',
          overlayY: 'bottom'
        },
        {
          originX: 'end',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top'
        }
      ]
    });

    popoverRef.afterClosed$.subscribe(() => {
      this.dropdownOpen = false;
      this.cd.markForCheck();
    });
  }
}
