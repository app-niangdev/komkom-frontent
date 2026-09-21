import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import { MenuItem } from '../interfaces/menu-item.interface';
import { trackById } from '@vex/utils/track-by';
import { VexPopoverRef } from '@vex/components/vex-popover/vex-popover-ref';
import { Router, RouterLink } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { User } from 'src/app/interfaces/User';
import { AuthService } from 'src/app/auth/services/auth.service';

export interface OnlineStatus {
  id: 'online' | 'away' | 'dnd' | 'offline';
  label: string;
  icon: string;
  colorClass: string;
}

@Component({
  selector: 'vex-toolbar-user-dropdown',
  templateUrl: './toolbar-user-dropdown.component.html',
  styleUrls: ['./toolbar-user-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
    NgFor,
    MatRippleModule,
    RouterLink,
    NgClass,
    // NgIf
  ]
})
export class ToolbarUserDropdownComponent implements OnInit {
  items: MenuItem[] = [
    {
      id: '1',
      icon: 'mat:account_circle',
      label: 'Mon Profil',
      description: 'Informations personnelles',
      colorClass: 'text-teal-600',
      route: '/index/profile'
    }
  ];

  trackById = trackById;
  userConnet:User | null = null;

  constructor(
    private cd: ChangeDetectorRef,
    private popoverRef: VexPopoverRef<ToolbarUserDropdownComponent>,
    private authService:AuthService,
    private router:Router
  ) {
    this.authService.getCurrentUser().subscribe({
      next:(response)=>{
        this.userConnet = response
      }
    })
  }

  ngOnInit() {

  }

  close() {
    this.popoverRef.close();
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.popoverRef.close();
        // Rediriger vers la page de login ou d'accueil
        this.router.navigate(['/login']);
      },
      error: err => {
        console.error('Erreur de déconnexion', err);
      }
    });
  }
}
