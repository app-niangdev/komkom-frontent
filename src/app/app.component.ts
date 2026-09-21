import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './auth/services/auth.service';
import { NavigationInitializerService } from './core/navigation/NavigationInitializerService';

@Component({
  selector: 'vex-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [RouterOutlet]
})
export class AppComponent implements OnInit {
  constructor(private navigationInitializer: NavigationInitializerService) {}

  ngOnInit() {
    this.navigationInitializer.initializeNavigation();
  }
}
