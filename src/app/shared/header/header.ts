import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { AuthService } from '../../features/auth/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class Header {
  // declarar propiedades sin usar this en el inicializador
  isAuthenticated$!: Observable<boolean>;
  currentUser$!: Observable<any>;

  constructor(private authService: AuthService, private router: Router) {
    // asignar aquí para evitar "used before initialization"
    this.isAuthenticated$ = this.authService.isAuthenticated$;
    this.currentUser$ = this.authService.currentUser$;
  }

  logout() {
    this.authService.logout();
    // navegar al inicio
    try { this.router.navigate(['/']); } catch (e) {}
  }

}
