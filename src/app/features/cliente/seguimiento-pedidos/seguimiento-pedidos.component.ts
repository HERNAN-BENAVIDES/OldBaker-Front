// src/app/features/cliente/seguimiento-pedidos/seguimiento-pedidos.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';

import { SeguimientoService } from '../services/seguimiento.service';
import { OrdenCompra, DeliveryStatus, DeliveryStatusLabels } from 'src/app/features/shared/models/pedido.model';
import { DetalleSeguimientoDialogComponent } from '../detalle-seguimiento/detalle-seguimiento-dialog.component';
import { EstadoPedidoComponent } from 'src/app/features/shared/components/estado-pedido/estado-pedido.component';

@Component({
  selector: 'app-seguimiento-pedidos',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    DecimalPipe, 
    DatePipe,
    MatDialogModule,
    EstadoPedidoComponent
  ],
  templateUrl: './seguimiento-pedidos.component.html',
  styleUrls: ['./seguimiento-pedidos.component.css']
})
export class SeguimientoPedidosComponent implements OnInit, OnDestroy {
  pedidos: OrdenCompra[] = [];
  pedidosFiltrados: OrdenCompra[] = [];
  cargando = true;
  filtroEstado: string = 'TODOS';
  busquedaTracking: string = '';
  
  // Polling
  private pollingSubscription?: Subscription;
  pollingActivo = false;

  constructor(
    private seguimientoService: SeguimientoService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarPedidos();
  }

  ngOnDestroy(): void {
    this.detenerPolling();
  }

  /**
   * Carga todos los pedidos del cliente
   */
  cargarPedidos(): void {
    this.cargando = true;
    this.seguimientoService.obtenerMisPedidos().subscribe({
      next: (data: OrdenCompra[]) => {
        this.pedidos = data.sort((a, b) => {
          const fechaA = new Date(a.fechaCreacion || '').getTime();
          const fechaB = new Date(b.fechaCreacion || '').getTime();
          return fechaB - fechaA;
        });
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (err: any) => {
        console.error('Error al cargar pedidos:', err);
        this.cargando = false;
      }
    });
  }

  /**
   * Filtra pedidos por estado
   */
  filtrarPorEstado(estado: string): void {
    this.filtroEstado = estado;
    this.aplicarFiltros();
  }

  /**
   * Aplica todos los filtros activos
   */
  aplicarFiltros(): void {
    let resultado = [...this.pedidos];

    if (this.filtroEstado !== 'TODOS') {
      resultado = resultado.filter(p => p.deliveryStatus === this.filtroEstado);
    }

    if (this.busquedaTracking.trim()) {
      const busqueda = this.busquedaTracking.toLowerCase();
      resultado = resultado.filter(p => 
        (p.trackingCode && p.trackingCode.toLowerCase().includes(busqueda)) ||
        p.externalReference.toLowerCase().includes(busqueda) ||
        (p.id && p.id.toString().includes(busqueda)) ||
        (p.orderId && p.orderId.toString().includes(busqueda))
      );
    }

    this.pedidosFiltrados = resultado;
  }

  /**
   * Busca pedido por código
   */
  buscarPorTracking(): void {
    this.aplicarFiltros();
  }

  /**
   * Ver detalles del pedido (abre modal)
   */
  verDetalle(pedido: OrdenCompra): void {
    const dialogRef = this.dialog.open(DetalleSeguimientoDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      data: pedido,
      panelClass: 'detalle-dialog'
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result === 'actualizado') {
        this.cargarPedidos();
      }
    });
  }

  /**
   * Obtiene el texto legible del estado
   */
  obtenerEstadoTexto(status?: DeliveryStatus): string {
    return status ? DeliveryStatusLabels[status] : 'N/A';
  }

  /**
   * Obtiene el color asociado al estado
   */
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

  /**
   * Obtiene el ícono asociado al estado
   */
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

  /**
   * Cuenta pedidos por estado
   */
  contarPorEstado(estado: string): number {
    if (estado === 'TODOS') {
      return this.pedidos.length;
    }
    return this.pedidos.filter(p => p.deliveryStatus === estado).length;
  }

  /**
   * Activa/desactiva actualización automática
   */
  togglePolling(): void {
    if (this.pollingActivo) {
      this.detenerPolling();
    } else {
      this.iniciarPolling();
    }
  }

  /**
   * Inicia polling para actualización automática cada 30 segundos
   */
  private iniciarPolling(): void {
    this.pollingActivo = true;
    this.pollingSubscription = interval(30000).pipe(
      startWith(0),
      switchMap(() => this.seguimientoService.obtenerMisPedidos())
    ).subscribe({
      next: (data: OrdenCompra[]) => {
        this.pedidos = data;
        this.aplicarFiltros();
      },
      error: (err: any) => {
        console.error('Error en polling:', err);
        this.detenerPolling();
      }
    });
  }

  /**
   * Detiene polling de actualización automática
   */
  private detenerPolling(): void {
    this.pollingActivo = false;
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  /**
   * Refresca manualmente los pedidos
   */
  refrescar(): void {
    this.cargarPedidos();
  }

  /**
   * Limpia filtros y búsqueda
   */
  limpiarFiltros(): void {
    this.filtroEstado = 'TODOS';
    this.busquedaTracking = '';
    this.aplicarFiltros();
  }
}