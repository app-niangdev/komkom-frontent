import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLinkActive, RouterLink, RouterOutlet } from '@angular/router';
import { fadeInRight400ms } from '@vex/animations/fade-in-right.animation';
import { scaleIn400ms } from '@vex/animations/scale-in.animation';
import { MatTabsModule } from '@angular/material/tabs';
import { Link } from '@vex/interfaces/link.interface';
import { AuthService } from 'src/app/auth/services/auth.service';
import { User } from 'src/app/interfaces/User';
import { CurrentUserAuth } from 'src/app/response-type/Type';

export interface FriendSuggestion {
  name: string;
  imageSrc: string;
  friends: number;
  added: boolean;
}
@Component({
  selector: 'vex-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  animations: [scaleIn400ms, fadeInRight400ms],
  standalone: true,
  imports: [
    NgIf,
    MatTabsModule,
    NgFor,
    RouterLinkActive,
    RouterLink,
    RouterOutlet
  ]
})
export class ProfileComponent implements OnInit {
  links: Link[] = [
    {
      label: 'Informations Prsonnelles',
      route: './',
      routerLinkActiveOptions: { exact: true }
    },
    {
      label: 'Sécurité',
      route: './security'
    }
  ];

  userConnet: CurrentUserAuth | null = null;
  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Charger les données initiales
    this.authService.getUserAuth().subscribe({
      next: (response) => {
        this.userConnet = response;
      }
    });

    // S'abonner aux mises à jour en temps réel
    this.authService.getCurrentUserAuth().subscribe({
      next: (response) => {
        if (response) {
          this.userConnet = response;
        }
      }
    });
  }
}
