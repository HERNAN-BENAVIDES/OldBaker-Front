// src/app/features/delivery/mis-entregas/mis-entregas.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeliveryService } from 'src/app/features/delivery/services/delivery.service';
import { OrdenCompra, DeliveryStatus, DeliveryStatusLabels, PaymentStatusLabels } from 'src/app/features/shared/models/pedido.model';
import { interval, Subscription } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-mis-entregas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mis-entregas.component.html',
  styleUrls: ['./mis-entregas.component.css']
})
export class MisEntregasComponent implements OnInit, OnDestroy {
  entregas: OrdenCompra[] = [];
  entregasFiltradas: OrdenCompra[] = [];
  cargando = true;
  filtroActivo: string = 'ACTIVAS';
  
  // Estadísticas
  estadisticas = {
    pendientes: 0,
    enCamino: 0,
    entregadas: 0,
    totalHoy: 0
  };

  // Polling
  private pollingSubscription?: Subscription;
  pollingActivo = false;

  constructor(private deliveryService: DeliveryService) {}

  ngOnInit(): void {
    this.cargarEntregas();
    this.iniciarPolling();
  }

  ngOnDestroy(): void {
    this.detenerPolling();
  }

  /**
   * Carga todas las entregas del repartidor
   */
  cargarEntregas(): void {
    this.cargando = true;
    this.deliveryService.obtenerMisEntregas().subscribe({
      next: (data) => {
        // Mapear orderId si viene en el response
        this.entregas = data.map(e => ({
          ...e,
          id: e.orderId || e.id
        })).sort((a, b) => {
          const fechaA = new Date(a.fechaAsignacion || a.fechaAsignacionRepartidor || '').getTime();
          const fechaB = new Date(b.fechaAsignacion || b.fechaAsignacionRepartidor || '').getTime();
          return fechaB - fechaA;
        });
        this.aplicarFiltro();
        this.actualizarEstadisticas();
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar entregas:', err);
        this.cargando = false;
      }
    });
  }

  /**
   * Actualiza estadísticas locales
   */
  actualizarEstadisticas(): void {
    this.estadisticas.pendientes = this.entregas.filter(
      e => e.deliveryStatus === 'PREPARING' || e.deliveryStatus === 'READY'
    ).length;
    
    this.estadisticas.enCamino = this.entregas.filter(
      e => e.deliveryStatus === 'IN_TRANSIT'
    ).length;
    
    this.estadisticas.entregadas = this.entregas.filter(
      e => e.deliveryStatus === 'DELIVERED'
    ).length;

    const hoy = new Date().toDateString();
    this.estadisticas.totalHoy = this.entregas.filter(e => {
      const fecha = new Date(e.fechaAsignacion || e.fechaAsignacionRepartidor || '').toDateString();
      return fecha === hoy;
    }).length;
  }

  /**
   * Aplica el filtro seleccionado
   */
  aplicarFiltro(): void {
    switch (this.filtroActivo) {
      case 'ACTIVAS':
        this.entregasFiltradas = this.entregas.filter(
          e => e.deliveryStatus !== 'DELIVERED' && e.deliveryStatus !== 'CANCELLED'
        );
        break;
      case 'PREPARANDO':
        this.entregasFiltradas = this.entregas.filter(
          e => e.deliveryStatus === 'PREPARING' || e.deliveryStatus === 'READY'
        );
        break;
      case 'EN_CAMINO':
        this.entregasFiltradas = this.entregas.filter(
          e => e.deliveryStatus === 'IN_TRANSIT'
        );
        break;
      case 'ENTREGADAS':
        this.entregasFiltradas = this.entregas.filter(
          e => e.deliveryStatus === 'DELIVERED'
        );
        break;
      default:
        this.entregasFiltradas = this.entregas;
    }
  }

  cambiarFiltro(filtro: string): void {
    this.filtroActivo = filtro;
    this.aplicarFiltro();
  }

  /**
   * Marca un pedido como recogido
   */
  marcarComoRecogido(entrega: OrdenCompra): void {
    if (confirm(`¿Confirmas que has recogido el pedido ${entrega.trackingCode}?`)) {
      this.deliveryService.marcarComoRecogido(entrega.id).subscribe({
        next: () => {
          alert('✅ Pedido marcado como recogido');
          this.cargarEntregas();
        },
        error: (err) => {
          console.error('Error:', err);
          alert('❌ Error al actualizar el estado');
        }
      });
    }
  }

  /**
   * Marca un pedido como entregado
   */
  marcarComoEntregado(entrega: OrdenCompra): void {
    const comentario = prompt('¿Algún comentario sobre la entrega? (opcional)');
    if (comentario !== null) {
      this.deliveryService.marcarComoEntregado(entrega.id, comentario).subscribe({
        next: () => {
          alert('✅ Pedido entregado exitosamente');
          this.cargarEntregas();
        },
        error: (err) => {
          console.error('Error:', err);
          alert('❌ Error al completar la entrega');
        }
      });
    }
  }

  /**
   * Reporta un problema
   */
  reportarProblema(entrega: OrdenCompra): void {
    const problema = prompt('Describe el problema con esta entrega:');
    if (problema && problema.trim()) {
      this.deliveryService.reportarProblema(entrega.id, problema).subscribe({
        next: () => alert('Problema reportado exitosamente'),
        error: (err) => {
          console.error('Error:', err);
          alert('Error al reportar el problema');
        }
      });
    }
  }

  /**
   * Abre Google Maps con la dirección
   */
  abrirMapa(entrega: OrdenCompra): void {
    if (entrega.direccionEntrega) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(entrega.direccionEntrega)}`;
      window.open(url, '_blank');
    } else {
      alert('No hay dirección de entrega disponible');
    }
  }

  llamarCliente(entrega: OrdenCompra): void {
    alert('Funcionalidad de llamada próximamente');
  }

  obtenerColorEstado(status?: DeliveryStatus): string {
    if (!status) return '#9E9E9E';
    const colores: Record<DeliveryStatus, string> = {
      'PREPARING': '#FF9800',
      'READY': '#2196F3',
      'IN_TRANSIT': '#4CAF50',
      'DELIVERED': '#388E3C',
      'CANCELLED': '#F44336'
    };
    return colores[status] || '#9E9E9E';
  }

  obtenerTextoEstado(status?: DeliveryStatus): string {
    return status ? DeliveryStatusLabels[status] : 'N/A';
  }

  obtenerIconoEstado(status?: DeliveryStatus): string {
    if (!status) return '📋';
    const iconos: Record<DeliveryStatus, string> = {
      'PREPARING': '👨‍🍳',
      'READY': '📦',
      'IN_TRANSIT': '🚚',
      'DELIVERED': '✅',
      'CANCELLED': '❌'
    };
    return iconos[status] || '📋';
  }

  puedeRecoger(entrega: OrdenCompra): boolean {
    return entrega.deliveryStatus === 'READY';
  }

  puedeEntregar(entrega: OrdenCompra): boolean {
    return entrega.deliveryStatus === 'IN_TRANSIT';
  }

  iniciarPolling(): void {
    this.pollingActivo = true;
    this.pollingSubscription = interval(30000).pipe(
      startWith(0),
      switchMap(() => this.deliveryService.obtenerMisEntregas())
    ).subscribe({
      next: (data) => {
        this.entregas = data.map(e => ({ ...e, id: e.orderId || e.id }));
        this.aplicarFiltro();
        this.actualizarEstadisticas();
      },
      error: (err) => console.error('Error en polling:', err)
    });
  }

  detenerPolling(): void {
    this.pollingActivo = false;
    this.pollingSubscription?.unsubscribe();
  }

  refrescar(): void {
    this.cargarEntregas();
  }

  formatearFecha(fecha: string | undefined): string {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}