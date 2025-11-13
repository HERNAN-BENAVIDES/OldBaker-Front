// src/app/features/cliente/detalle-seguimiento/detalle-seguimiento-dialog.component.ts

import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SeguimientoService } from '../services/seguimiento.service';
import { OrdenCompra, DeliveryStatus, PaymentStatus, PaymentStatusLabels, DeliveryStatusLabels } from 'src/app/features/shared/models/pedido.model';

@Component({
  selector: 'app-detalle-seguimiento-dialog',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './detalle-seguimiento-dialog.component.html',
  styleUrls: ['./detalle-seguimiento-dialog.component.css']
})
export class DetalleSeguimientoDialogComponent implements OnInit {
  pedido: OrdenCompra;
  detallesCompletos: any = null;
  cargandoDetalles = false;
  
  // Timeline de estados
  timeline = [
    { estado: 'PREPARING', label: 'En preparación', icon: '👨‍🍳', completado: false },
    { estado: 'READY', label: 'Listo para envío', icon: '📦', completado: false },
    { estado: 'IN_TRANSIT', label: 'En camino', icon: '🚚', completado: false },
    { estado: 'DELIVERED', label: 'Entregado', icon: '✅', completado: false }
  ];

  constructor(
    public dialogRef: MatDialogRef<DetalleSeguimientoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: OrdenCompra,
    private seguimientoService: SeguimientoService
  ) {
    this.pedido = data;
  }

  ngOnInit(): void {
    this.actualizarTimeline();
    this.cargarDetallesCompletos();
  }

  /**
   * Carga detalles completos del pedido desde el backend
   */
  cargarDetallesCompletos(): void {
    this.cargandoDetalles = true;
    // Usar externalReference en lugar de orderId
    this.seguimientoService.obtenerEstadoPedido(this.pedido.externalReference).subscribe({
      next: (detalles: any) => {
        this.detallesCompletos = detalles;
        this.cargandoDetalles = false;
      },
      error: (err: any) => {
        console.error('Error al cargar detalles:', err);
        this.cargandoDetalles = false;
      }
    });
  }

  /**
   * Actualiza el timeline según el estado actual
   */
  actualizarTimeline(): void {
    const estadoActualIndex = this.timeline.findIndex(t => t.estado === this.pedido.deliveryStatus);
    
    this.timeline.forEach((item, index) => {
      item.completado = index <= estadoActualIndex;
    });
  }

  /**
   * Obtiene el color del estado de pago
   */
  obtenerColorPago(status?: PaymentStatus): string {
    if (!status) return '#9E9E9E';
    const colores: Record<PaymentStatus, string> = {
      'PAID': '#4CAF50',
      'PENDING': '#FF9800',
      'FAILED': '#F44336',
      'CANCELLED': '#757575',
      'IN_PROCESS': '#2196F3'
    };
    return colores[status] || '#9E9E9E';
  }

  /**
   * Obtiene el color del estado de entrega
   */
  obtenerColorEntrega(status?: DeliveryStatus): string {
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
   * Obtiene el texto del estado de pago
   */
  obtenerTextoPago(status?: PaymentStatus): string {
    return status ? PaymentStatusLabels[status] : 'N/A';
  }

  /**
   * Obtiene el texto del estado de entrega
   */
  obtenerTextoEntrega(status?: DeliveryStatus): string {
    return status ? DeliveryStatusLabels[status] : 'N/A';
  }

  /**
   * Calcula el tiempo estimado de entrega restante
   */
  obtenerTiempoRestante(): string {
    if (!this.pedido.fechaEntregaEstimada) {
      return 'No disponible';
    }

    const ahora = new Date();
    const entrega = new Date(this.pedido.fechaEntregaEstimada);
    const diferenciaMilisegundos = entrega.getTime() - ahora.getTime();

    if (diferenciaMilisegundos < 0) {
      return 'Tiempo excedido';
    }

    const horas = Math.floor(diferenciaMilisegundos / (1000 * 60 * 60));
    const minutos = Math.floor((diferenciaMilisegundos % (1000 * 60 * 60)) / (1000 * 60));

    if (horas < 1) {
      return `${minutos} minutos`;
    }

    return `${horas}h ${minutos}m`;
  }

  /**
   * Copia el código de tracking al portapapeles
   */
  copiarTracking(): void {
    if (!this.pedido.trackingCode) {
      alert('No hay código de seguimiento disponible');
      return;
    }
    
    navigator.clipboard.writeText(this.pedido.trackingCode).then(() => {
      alert('Código de seguimiento copiado al portapapeles');
    }).catch(err => {
      console.error('Error al copiar:', err);
    });
  }

  /**
   * Compartir tracking por WhatsApp
   */
  compartirWhatsApp(): void {
    if (!this.pedido.trackingCode) {
      alert('No hay código de seguimiento disponible');
      return;
    }
    
    const mensaje = `Hola! Mi pedido de OldBaker tiene el código de seguimiento: ${this.pedido.trackingCode}`;
    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  }

  /**
   * Cierra el dialog
   */
  cerrar(): void {
    this.dialogRef.close();
  }

  /**
   * Refresca los datos del pedido
   */
  refrescar(): void {
    this.cargarDetallesCompletos();
  }

  /**
   * Verifica si el pedido puede ser cancelado
   */
  puedeCancelar(): boolean {
    return this.pedido.deliveryStatus === 'PREPARING' || 
           this.pedido.deliveryStatus === 'READY';
  }

  /**
   * Cancela el pedido
   */
  cancelarPedido(): void {
    if (confirm('¿Estás seguro de que deseas cancelar este pedido?')) {
      this.seguimientoService.cancelarPedido(this.pedido.externalReference).subscribe({
        next: () => {
          alert('Pedido cancelado exitosamente');
          this.dialogRef.close('actualizado');
        },
        error: (err: any) => {
          console.error('Error al cancelar pedido:', err);
          alert('No se pudo cancelar el pedido. Intenta nuevamente.');
        }
      });
    }
  }

  /**
   * Formatea la fecha de manera legible
   */
  formatearFecha(fecha?: string): string {
    if (!fecha) return 'No disponible';
    
    const date = new Date(fecha);
    const opciones: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return date.toLocaleDateString('es-CO', opciones);
  }

  /**
   * Obtiene el porcentaje de progreso
   */
  obtenerProgreso(): number {
    const estadoIndex = this.timeline.findIndex(t => t.estado === this.pedido.deliveryStatus);
    if (estadoIndex === -1) return 0;
    return ((estadoIndex + 1) / this.timeline.length) * 100;
  }
}