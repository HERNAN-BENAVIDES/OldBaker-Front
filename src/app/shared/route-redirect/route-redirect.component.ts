import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-route-redirect',
  standalone: true,
  imports: [CommonModule],
  template: ''
})
export class RouteRedirectComponent implements OnInit {
  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    const rolRaw = user?.rol || user?.role || '';
    const userRole = String(rolRaw ?? '').toUpperCase();

    if (userRole === 'ADMIN' || userRole === 'ADMINISTRADOR') {
      this.router.navigate(['/admin']);
    } else if (userRole === 'AUXILIAR') {
      this.router.navigate(['/auxiliar']);
    } else {
      this.router.navigate(['/']);
    }
  }
}
