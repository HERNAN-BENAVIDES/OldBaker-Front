import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

interface Pedido {
  id: number;
  fecha: string;
  total: number;
  estado: 'pendiente' | 'en_proceso' | 'completado' | 'cancelado';
  productos: {
    nombre: string;
    cantidad: number;
    precioUnitario: number;
  }[];
}

@Component({
  selector: 'app-mis-pedidos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mis-pedidos.component.html',
  styleUrls: ['./mis-pedidos.component.css']
})
export class MisPedidosComponent implements OnInit {
  pedidos: Pedido[] = [];
  loading = true;
  error: string | null = null;

  constructor(private router: Router) {}

  ngOnInit() {
    this.cargarPedidos();
  }

  cargarPedidos() {
    // Simulación de carga - aquí deberías hacer la petición HTTP real
    setTimeout(() => {
      this.pedidos = [
        {
          id: 1001,
          fecha: '2025-01-15',
          total: 25000,
          estado: 'completado',
          productos: [
            { nombre: 'Baguette', cantidad: 2, precioUnitario: 3500 },
            { nombre: 'Croissant', cantidad: 4, precioUnitario: 4500 }
          ]
        },
        {
          id: 1002,
          fecha: '2025-01-14',
          total: 15000,
          estado: 'en_proceso',
          productos: [
            { nombre: 'Pan de Queso', cantidad: 6, precioUnitario: 2500 }
          ]
        },
        {
          id: 1003,
          fecha: '2025-01-10',
          total: 42000,
          estado: 'completado',
          productos: [
            { nombre: 'Pan Integral', cantidad: 3, precioUnitario: 3200 },
            { nombre: 'Ciabatta', cantidad: 5, precioUnitario: 3800 },
            { nombre: 'Rollos de Canela', cantidad: 4, precioUnitario: 4000 }
          ]
        }
      ];
      this.loading = false;
    }, 1000);
  }

  getEstadoClass(estado: string): string {
    const clases: { [key: string]: string } = {
      'pendiente': 'estado-pendiente',
      'en_proceso': 'estado-en-proceso',
      'completado': 'estado-completado',
      'cancelado': 'estado-cancelado'
    };
    return clases[estado] || '';
  }

  getEstadoTexto(estado: string): string {
    const textos: { [key: string]: string } = {
      'pendiente': 'Pendiente',
      'en_proceso': 'En proceso',
      'completado': 'Completado',
      'cancelado': 'Cancelado'
    };
    return textos[estado] || estado;
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  goBack() {
    this.router.navigate(['..']);
  }
}
