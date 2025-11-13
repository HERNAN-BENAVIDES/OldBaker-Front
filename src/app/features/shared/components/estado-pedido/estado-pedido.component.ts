// src/app/shared/components/estado-pedido/estado-pedido.component.ts

import { Component, Input, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { DeliveryStatus } from '../../models/pedido.model';

@Component({
  selector: 'app-estado-pedido',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './estado-pedido.component.html',
  styleUrls: ['./estado-pedido.component.css']
})
export class EstadoPedidoComponent implements OnInit {
  @Input() estado!: string;
  @Input() mostrarTexto: boolean = true;
  @Input() tamanio: 'small' | 'medium' | 'large' = 'medium';

  estados = [
    { 
      key: 'PREPARING', 
      label: 'Preparando', 
      icon: '👨‍🍳',
      descripcion: 'Tu pedido está siendo preparado con cariño'
    },
    { 
      key: 'READY', 
      label: 'Listo', 
      icon: '📦',
      descripcion: 'Tu pedido está listo para ser enviado'
    },
    { 
      key: 'IN_TRANSIT', 
      label: 'En camino', 
      icon: '🚚',
      descripcion: 'Tu pedido va en camino a tu dirección'
    },
    { 
      key: 'DELIVERED', 
      label: 'Entregado', 
      icon: '✅',
      descripcion: '¡Tu pedido ha sido entregado exitosamente!'
    }
  ];

  constructor() {}

  ngOnInit(): void {
    // Validar que el estado exista
    if (!this.estado) {
      console.warn('EstadoPedidoComponent: No se proporcionó un estado');
      this.estado = 'PREPARING';
    }
  }

  /**
   * Obtiene el índice del estado actual
   */
  obtenerIndiceEstado(): number {
    return this.estados.findIndex(e => e.key === this.estado);
  }

  /**
   * Calcula el porcentaje de progreso
   */
  obtenerProgreso(): number {
    const index = this.obtenerIndiceEstado();
    if (index === -1) return 0;
    return ((index + 1) / this.estados.length) * 100;
  }

  /**
   * Verifica si un estado está completado
   */
  estaCompletado(estadoKey: string): boolean {
    const indexActual = this.obtenerIndiceEstado();
    const indexComparar = this.estados.findIndex(e => e.key === estadoKey);
    
    if (indexActual === -1 || indexComparar === -1) return false;
    
    return indexComparar <= indexActual;
  }

  /**
   * Verifica si un estado es el actual
   */
  esEstadoActual(estadoKey: string): boolean {
    return this.estado === estadoKey;
  }

  /**
   * Obtiene la descripción del estado actual
   */
  obtenerDescripcionActual(): string {
    const estadoActual = this.estados.find(e => e.key === this.estado);
    return estadoActual?.descripcion || '';
  }

  /**
   * Obtiene clases CSS según el tamaño (sin ñ)
   */
  obtenerClaseTamanio(): string {
    return `size-${this.tamanio}`;
  }
}