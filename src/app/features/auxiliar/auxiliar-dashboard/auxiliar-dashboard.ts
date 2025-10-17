import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService } from '../../../shared/notification/notification.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

interface ModuleStats {
  pendingOrders: number;
  activeOrders: number;
  pendingReports: number;
  approvedOrders: number;
  pendingVerification: number;
  activeReports: number;
}

@Component({
  selector: 'app-auxiliar-dashboard',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatMenuModule, MatIconModule, MatSnackBarModule],
  templateUrl: './auxiliar-dashboard.html',
  styleUrls: ['./auxiliar-dashboard.css']
})
export class AuxiliarDashboardComponent implements OnInit, OnDestroy {

  // Usando signals como en tu app.ts
  readonly moduleStats = signal<ModuleStats>({
    pendingOrders: 3,
    activeOrders: 5,
    pendingReports: 1,
    approvedOrders: 12,
    pendingVerification: 3,
    activeReports: 1
  });

  readonly isLoading = signal(false);
  readonly showNotification = signal(false);
  readonly notificationMessage = signal('');
  readonly notificationType = signal<'success' | 'error' | 'info' | 'warning'>('info');

  // Usuario actual
  userName: string = 'Auxiliar';

  private refreshSubscription?: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private notifications: NotificationService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    console.log('Panel del Auxiliar - OldBaker iniciado');
    this.loadUserInfo();
    this.loadModuleStats();
    this.setupAutoRefresh();
  }

  // Cargar información del usuario
  loadUserInfo(): void {
    const user = this.authService.getCurrentUser();
    if (user && user.nombre) {
      this.userName = user.nombre;
    }
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  /**
   * Navega a un módulo específico del auxiliar
   */
  navigateToModule(module: string): void {
    console.log(`Navegando a: ${module}`);
    this.showLoadingIndicator();

    // Simular delay de navegación
    setTimeout(() => {
      switch (module) {
        case 'detalles-pedidos':
          this.router.navigate(['/auxiliar/detalles-pedidos']);
          break;
        case 'pedidos-insumos':
          this.router.navigate(['/auxiliar/pedidos-insumos']);
          break;
        case 'reportes-proveedores':
          this.router.navigate(['/auxiliar/reportes-proveedores']);
          break;
        default:
          this.showNotificationMessage('Módulo no encontrado', 'error');
          this.hideLoadingIndicator();
      }
    }, 500);
  }

  /**
   * Ejecuta una acción rápida
   */
  quickAction(action: string): void {
    console.log(`Ejecutando acción: ${action}`);
    this.showLoadingIndicator();

    switch (action) {
      case 'verificar-pedido':
        this.verifyLastOrder();
        break;
      case 'crear-reporte':
        this.createReport();
        break;
      case 'ver-historial':
        this.viewHistory();
        break;
      default:
        this.showNotificationMessage('Acción no reconocida', 'error');
        this.hideLoadingIndicator();
    }
  }

  /**
   * Verifica el último pedido recibido
   */
  private verifyLastOrder(): void {
    setTimeout(() => {
      this.hideLoadingIndicator();
      this.showNotificationMessage('Redirigiendo a verificación de pedido...', 'info');

      setTimeout(() => {
        this.router.navigate(['/auxiliar/verificar-pedido']);
      }, 1000);
    }, 800);
  }

  /**
   * Abre el formulario para crear un nuevo reporte
   */
  private createReport(): void {
    setTimeout(() => {
      this.hideLoadingIndicator();
      this.showNotificationMessage('Abriendo formulario de reporte...', 'info');

      setTimeout(() => {
        this.router.navigate(['/auxiliar/crear-reporte']);
      }, 1000);
    }, 800);
  }

  /**
   * Muestra el historial de pedidos y reportes
   */
  private viewHistory(): void {
    setTimeout(() => {
      this.hideLoadingIndicator();
      this.showNotificationMessage('Cargando historial...', 'info');

      setTimeout(() => {
        this.router.navigate(['/auxiliar/historial']);
      }, 1000);
    }, 800);
  }

  /**
   * Carga las estadísticas de los módulos desde el servidor
   */
  private loadModuleStats(): void {
    // Simular carga de datos del servidor
    const stats: ModuleStats = {
      pendingOrders: Math.floor(Math.random() * 5) + 1,
      activeOrders: Math.floor(Math.random() * 10) + 3,
      pendingReports: Math.floor(Math.random() * 3),
      approvedOrders: Math.floor(Math.random() * 20) + 10,
      pendingVerification: Math.floor(Math.random() * 5),
      activeReports: Math.floor(Math.random() * 3)
    };

    this.moduleStats.set(stats);
    console.log('Estadísticas del módulo cargadas:', this.moduleStats());
  }

  /**
   * Configura la actualización automática de datos
   */
  private setupAutoRefresh(): void {
    // Actualizar cada 30 segundos
    const refreshInterval = 30000;

    this.refreshSubscription = new Subscription();
    const intervalId = setInterval(() => {
      console.log('Actualizando estadísticas automáticamente...');
      this.loadModuleStats();
    }, refreshInterval);

    this.refreshSubscription.add(() => clearInterval(intervalId));
  }

  /**
   * Actualiza las estadísticas manualmente
   */
  refreshStats(): void {
    this.loadModuleStats();
    this.showNotificationMessage('Estadísticas actualizadas', 'success');
  }

  /**
   * Verifica si hay pedidos pendientes de verificación
   */
  hasPendingVerification(): boolean {
    return this.moduleStats().pendingVerification > 0;
  }

  /**
   * Verifica si hay reportes activos
   */
  hasActiveReports(): boolean {
    return this.moduleStats().activeReports > 0;
  }

  /**
   * Obtiene el color del estado basado en la cantidad de items
   */
  getStatusColor(value: number): string {
    if (value === 0) return 'success';
    if (value <= 3) return 'warning';
    return 'danger';
  }

  /**
   * Muestra el indicador de carga
   */
  private showLoadingIndicator(): void {
    this.isLoading.set(true);
  }

  /**
   * Oculta el indicador de carga
   */
  private hideLoadingIndicator(): void {
    this.isLoading.set(false);
  }

  /**
   * Muestra una notificación al usuario
   */
  private showNotificationMessage(
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info'
  ): void {
    this.notificationMessage.set(message);
    this.notificationType.set(type);
    this.showNotification.set(true);

    // Auto-ocultar después de 3 segundos
    setTimeout(() => {
      this.showNotification.set(false);
    }, 3000);
  }

  /**
   * Cierra la notificación manualmente
   */
  closeNotification(): void {
    this.showNotification.set(false);
  }

  /**
   * Obtiene la hora de la última actualización
   */
  getLastUpdateTime(): string {
    return new Date().toLocaleTimeString('es-ES');
  }

  /**
   * Maneja errores de navegación
   */
  onNavigationError(error: any): void {
    console.error('Error de navegación:', error);
    this.showNotificationMessage('Error de navegación. Intente nuevamente.', 'error');
    this.hideLoadingIndicator();
  }

  /**
   * Cierra la sesión del usuario
   */
  logout(): void {
    this.notifications.showConfirm(
      '¿Está seguro de que desea cerrar sesión?',
      () => {
        // Usuario confirmó
        this.authService.logout();
        this.snackBar.open('Cerrando sesión...', 'Cerrar', {
          duration: 2000
        });
        setTimeout(() => {
          this.router.navigate(['/auth/worker/login']);
        }, 500);
      },
      () => {
        // Usuario canceló (no hacer nada)
      }
    );
  }
}
