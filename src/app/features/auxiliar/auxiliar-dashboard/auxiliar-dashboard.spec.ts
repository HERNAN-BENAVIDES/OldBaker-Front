import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { CommonModule } from '@angular/common';
import { signal } from '@angular/core';

import { AuxiliarDashboardComponent } from './auxiliar-dashboard';

describe('AuxiliarDashboardComponent', () => {
  let component: AuxiliarDashboardComponent;
  let fixture: ComponentFixture<AuxiliarDashboardComponent>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    // Crear spy para el Router
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        AuxiliarDashboardComponent, // Standalone component se importa directamente
        CommonModule
      ],
      providers: [
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AuxiliarDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Helpers para acceder a propiedades protected
  const getModuleStats = () => (component as any).moduleStats;
  const getIsLoading = () => (component as any).isLoading;
  const getShowNotification = () => (component as any).showNotification;
  const getNotificationMessage = () => (component as any).notificationMessage;
  const getNotificationType = () => (component as any).notificationType;

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with default module stats signal', () => {
      const stats = getModuleStats()();
      expect(stats).toBeDefined();
      expect(stats.pendingOrders).toBeGreaterThanOrEqual(1);
      expect(stats.activeOrders).toBeGreaterThanOrEqual(3);
      expect(stats.pendingReports).toBeGreaterThanOrEqual(0);
      expect(stats.approvedOrders).toBeGreaterThanOrEqual(10);
      expect(stats.pendingVerification).toBeGreaterThanOrEqual(0);
      expect(stats.activeReports).toBeGreaterThanOrEqual(0);
    });

    it('should initialize loading signal as false', () => {
      expect(getIsLoading()()).toBeFalse();
    });

    it('should initialize notification signals with default values', () => {
      expect(getShowNotification()()).toBeFalse();
      expect(getNotificationMessage()()).toBe('');
      expect(getNotificationType()()).toBe('info');
    });

    it('should call loadModuleStats and setupAutoRefresh on init', () => {
      spyOn(component as any, 'loadModuleStats');
      spyOn(component as any, 'setupAutoRefresh');
      
      component.ngOnInit();
      
      expect((component as any).loadModuleStats).toHaveBeenCalled();
      expect((component as any).setupAutoRefresh).toHaveBeenCalled();
    });
  });

  describe('Navigation Methods', () => {
    it('should navigate to detalles-pedidos module', (done) => {
      component.navigateToModule('detalles-pedidos');
      
      // Verificar que se muestra el loading
      expect(getIsLoading()()).toBeTrue();
      
      // Esperar a que termine el timeout
      setTimeout(() => {
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/auxiliar/detalles-pedidos']);
        done();
      }, 600);
    });

    it('should navigate to pedidos-insumos module', (done) => {
      component.navigateToModule('pedidos-insumos');
      
      setTimeout(() => {
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/auxiliar/pedidos-insumos']);
        done();
      }, 600);
    });

    it('should navigate to reportes-proveedores module', (done) => {
      component.navigateToModule('reportes-proveedores');
      
      setTimeout(() => {
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/auxiliar/reportes-proveedores']);
        done();
      }, 600);
    });

    it('should show error notification for unknown module', (done) => {
      spyOn(console, 'log');
      component.navigateToModule('unknown-module');
      
      setTimeout(() => {
        expect(getShowNotification()()).toBeTrue();
        expect(getNotificationMessage()()).toBe('Módulo no encontrado');
        expect(getNotificationType()()).toBe('error');
        expect(getIsLoading()()).toBeFalse();
        done();
      }, 100);
    });
  });

  describe('Quick Actions', () => {
    it('should handle verificar-pedido action', (done) => {
      component.quickAction('verificar-pedido');
      
      expect(getIsLoading()()).toBeTrue();
      
      setTimeout(() => {
        expect(getShowNotification()()).toBeTrue();
        expect(getNotificationMessage()()).toBe('Redirigiendo a verificación de pedido...');
        
        setTimeout(() => {
          expect(mockRouter.navigate).toHaveBeenCalledWith(['/auxiliar/verificar-pedido']);
          done();
        }, 1100);
      }, 900);
    });

    it('should handle crear-reporte action', (done) => {
      component.quickAction('crear-reporte');
      
      setTimeout(() => {
        expect(getShowNotification()()).toBeTrue();
        expect(getNotificationMessage()()).toBe('Abriendo formulario de reporte...');
        
        setTimeout(() => {
          expect(mockRouter.navigate).toHaveBeenCalledWith(['/auxiliar/crear-reporte']);
          done();
        }, 1100);
      }, 900);
    });

    it('should handle ver-historial action', (done) => {
      component.quickAction('ver-historial');
      
      setTimeout(() => {
        expect(getShowNotification()()).toBeTrue();
        expect(getNotificationMessage()()).toBe('Cargando historial...');
        
        setTimeout(() => {
          expect(mockRouter.navigate).toHaveBeenCalledWith(['/auxiliar/historial']);
          done();
        }, 1100);
      }, 900);
    });

    it('should show error for unknown action', (done) => {
      component.quickAction('unknown-action');
      
      setTimeout(() => {
        expect(getShowNotification()()).toBeTrue();
        expect(getNotificationMessage()()).toBe('Acción no reconocida');
        expect(getNotificationType()()).toBe('error');
        expect(getIsLoading()()).toBeFalse();
        done();
      }, 100);
    });
  });

  describe('Status Methods', () => {
    it('should return true when there are pending verifications', () => {
      // Simulamos que hay verificaciones pendientes
      const currentStats = getModuleStats()();
      getModuleStats().set({
        ...currentStats,
        pendingVerification: 5
      });
      
      expect(component.hasPendingVerification()).toBeTruthy();
    });

    it('should return false when there are no pending verifications', () => {
      const currentStats = getModuleStats()();
      getModuleStats().set({
        ...currentStats,
        pendingVerification: 0
      });
      
      expect(component.hasPendingVerification()).toBeFalsy();
    });

    it('should return true when there are active reports', () => {
      const currentStats = getModuleStats()();
      getModuleStats().set({
        ...currentStats,
        activeReports: 2
      });
      
      expect(component.hasActiveReports()).toBeTruthy();
    });

    it('should return false when there are no active reports', () => {
      const currentStats = getModuleStats()();
      getModuleStats().set({
        ...currentStats,
        activeReports: 0
      });
      
      expect(component.hasActiveReports()).toBeFalsy();
    });
  });

  describe('Status Color Methods', () => {
    it('should return "success" for 0 pending items', () => {
      expect(component.getStatusColor(0)).toBe('success');
    });

    it('should return "warning" for 1-3 pending items', () => {
      expect(component.getStatusColor(1)).toBe('warning');
      expect(component.getStatusColor(3)).toBe('warning');
    });

    it('should return "danger" for more than 3 pending items', () => {
      expect(component.getStatusColor(4)).toBe('danger');
      expect(component.getStatusColor(10)).toBe('danger');
    });
  });

  describe('Notification Methods', () => {
    it('should show and auto-hide notifications', (done) => {
      (component as any).showNotificationMessage('Test message', 'success');
      
      expect(getShowNotification()()).toBeTrue();
      expect(getNotificationMessage()()).toBe('Test message');
      expect(getNotificationType()()).toBe('success');
      
      // Verificar auto-hide después de 3 segundos
      setTimeout(() => {
        expect(getShowNotification()()).toBeFalse();
        done();
      }, 3100);
    });

    it('should close notification manually', () => {
      (component as any).showNotificationMessage('Test message');
      expect(getShowNotification()()).toBeTrue();
      
      component.closeNotification();
      expect(getShowNotification()()).toBeFalse();
    });
  });

  describe('Utility Methods', () => {
    it('should refresh stats and show success notification', () => {
      component.refreshStats();
      
      expect(getShowNotification()()).toBeTrue();
      expect(getNotificationMessage()()).toBe('Estadísticas actualizadas');
      expect(getNotificationType()()).toBe('success');
      
      // Verificar que las estadísticas pueden haber cambiado (son aleatorias)
      const newStats = getModuleStats()();
      expect(newStats).toBeDefined();
    });

    it('should return formatted last update time', () => {
      const time = component.getLastUpdateTime();
      expect(time).toMatch(/^\d{1,2}:\d{2}:\d{2}$/); // Formato HH:MM:SS
    });

    it('should handle navigation errors', () => {
      spyOn(console, 'error');
      const error = new Error('Navigation failed');
      
      component.onNavigationError(error);
      
      expect(console.error).toHaveBeenCalledWith('Error de navegación:', error);
      expect(getShowNotification()()).toBeTrue();
      expect(getNotificationMessage()()).toBe('Error de navegación. Intente nuevamente.');
      expect(getNotificationType()()).toBe('error');
      expect(getIsLoading()()).toBeFalse();
    });
  });

  describe('Component Lifecycle', () => {
    it('should unsubscribe on destroy', () => {
      // Simular que hay una suscripción activa
      const mockSubscription = {
        unsubscribe: jasmine.createSpy('unsubscribe')
      };
      
      (component as any).refreshSubscription = mockSubscription;
      
      component.ngOnDestroy();
      
      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
    });

    it('should not fail when destroying without subscription', () => {
      (component as any).refreshSubscription = undefined;
      
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('DOM Elements', () => {
    it('should render module cards with correct data', () => {
      fixture.detectChanges();
      const moduleCards = fixture.debugElement.queryAll(By.css('.module-card'));
      expect(moduleCards.length).toBe(3);
    });

    it('should render status items with correct data', () => {
      fixture.detectChanges();
      const statusItems = fixture.debugElement.queryAll(By.css('.status-item'));
      expect(statusItems.length).toBe(3);
    });

    it('should render quick action buttons', () => {
      fixture.detectChanges();
      const actionButtons = fixture.debugElement.queryAll(By.css('.action-btn'));
      expect(actionButtons.length).toBe(4); // 3 acciones rápidas + 1 botón de actualizar
    });

    it('should display correct statistics in module cards', () => {
      fixture.detectChanges();
      const statsNumbers = fixture.debugElement.queryAll(By.css('.stat-number'));
      expect(statsNumbers.length).toBe(3);
      
      // Verificar que muestran valores numéricos
      statsNumbers.forEach(stat => {
        const value = parseInt(stat.nativeElement.textContent.trim());
        expect(value).toBeGreaterThanOrEqual(0);
      });
    });

    it('should show loading overlay when isLoading is true', () => {
      getIsLoading().set(true);
      fixture.detectChanges();
      
      const loadingOverlay = fixture.debugElement.query(By.css('.loading-overlay'));
      expect(loadingOverlay).toBeTruthy();
    });

    it('should hide loading overlay when isLoading is false', () => {
      getIsLoading().set(false);
      fixture.detectChanges();
      
      const loadingOverlay = fixture.debugElement.query(By.css('.loading-overlay'));
      expect(loadingOverlay).toBeFalsy();
    });

    it('should show notification when showNotification is true', () => {
      getShowNotification().set(true);
      getNotificationMessage().set('Test notification');
      fixture.detectChanges();
      
      const notification = fixture.debugElement.query(By.css('.notification'));
      expect(notification).toBeTruthy();
      expect(notification.nativeElement.textContent).toContain('Test notification');
    });
  });

  describe('Click Events', () => {
    it('should call navigateToModule when module card is clicked', () => {
      spyOn(component, 'navigateToModule');
      fixture.detectChanges();
      
      const moduleCard = fixture.debugElement.query(By.css('.module-card'));
      moduleCard.nativeElement.click();
      
      expect(component.navigateToModule).toHaveBeenCalled();
    });

    it('should call quickAction when action button is clicked', () => {
      spyOn(component, 'quickAction');
      fixture.detectChanges();
      
      const actionButton = fixture.debugElement.query(By.css('.action-btn'));
      actionButton.nativeElement.click();
      
      expect(component.quickAction).toHaveBeenCalled();
    });

    it('should call closeNotification when close button is clicked', () => {
      spyOn(component, 'closeNotification');
      
      // Mostrar notificación primero
      getShowNotification().set(true);
      fixture.detectChanges();
      
      const closeButton = fixture.debugElement.query(By.css('.notification-close'));
      closeButton.nativeElement.click();
      
      expect(component.closeNotification).toHaveBeenCalled();
    });
  });

  describe('Signal Integration', () => {
    it('should update DOM when signals change', () => {
      const newStats = {
        pendingOrders: 10,
        activeOrders: 15,
        pendingReports: 5,
        approvedOrders: 25,
        pendingVerification: 8,
        activeReports: 3
      };
      
      getModuleStats().set(newStats);
      fixture.detectChanges();
      
      const statsNumbers = fixture.debugElement.queryAll(By.css('.stat-number'));
      expect(statsNumbers[0].nativeElement.textContent.trim()).toBe('10');
    });

    it('should disable buttons when loading', () => {
      getIsLoading().set(true);
      fixture.detectChanges();
      
      const actionButtons = fixture.debugElement.queryAll(By.css('.action-btn'));
      actionButtons.forEach(button => {
        expect(button.nativeElement.disabled).toBeTruthy();
      });
    });
  });
});