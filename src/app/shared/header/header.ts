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
  // declarar propiedades sin inicializar; se asignan en el constructor
  isAuthenticated$!: Observable<boolean>;
  currentUser$!: Observable<any>;
  // estado para mostrar/ocultar el dropdown del avatar
  showMenu = false;

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

  toggleMenu(e?: Event) {
    if (e) { e.stopPropagation(); }
    this.showMenu = !this.showMenu;
  }

  logoutMenu() {
    this.showMenu = false;
    this.logout();
  }

  // devolver inicial para avatar a partir de nombre o email
  avatarInitial(user: any): string {
    if (!user) return '';
    const name = user.nombre ?? user.name ?? user.email ?? '';
    const ch = String(name).trim().charAt(0) || '';
    return ch.toUpperCase();
  }

}
