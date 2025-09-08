import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { AuthService } from '../../features/auth/services/auth.service';

@Injectable({ providedIn: 'root' })
export class IdleService implements OnDestroy {
  private timeoutId: any = null;
  private readonly idleTime = 60_000; // 1 minuto
  private readonly events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
  private activityHandler = () => this.resetTimer();

  constructor(private authService: AuthService, private ngZone: NgZone) {}

  ngOnDestroy(): void {
    this.stopWatching();
  }

  startWatching(): void {
    this.stopWatching(); // asegurar estado limpio
    // Añadir listeners fuera de Angular para no disparar CD constantemente
    this.ngZone.runOutsideAngular(() => {
      this.events.forEach(evt => window.addEventListener(evt, this.activityHandler, true));
    });
    this.resetTimer();
  }

  stopWatching(): void {
    this.events.forEach(evt => window.removeEventListener(evt, this.activityHandler, true));
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private resetTimer(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    // Ejecutar logout cuando se cumpla el tiempo de inactividad
    this.timeoutId = setTimeout(() => {
      this.ngZone.run(() => {
        this.authService.logout();
        this.stopWatching(); // detener vigilancia después del logout
      });
    }, this.idleTime);
  }
}

