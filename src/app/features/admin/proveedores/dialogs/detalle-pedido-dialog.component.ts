import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectChange } from '@angular/material/select'; // <- importar

interface ItemPedido {
  id: number;
  insumo: string;
  cantidadPedida: number;
  cantidadRecibida: number;
  precioUnitario: number;
  fechaVencimiento?: string;
  estado: 'completo' | 'incompleto' | 'vencido' | 'defectuoso';
  observaciones?: string;
}

interface PedidoDetalle {
  id: number;
  proveedor: string;
  fechaPedido: string;
  fechaEntrega: string;
  estado: 'pendiente' | 'recibido' | 'verificado' | 'incompleto' | 'aprobado' | 'rechazado';
  items: ItemPedido[];
  total: number;
}

interface DialogData {
  pedido: PedidoDetalle;
  isEdit: boolean;
}

@Component({
  selector: 'app-detalle-pedido-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatTableModule,
    MatCardModule,
    MatChipsModule,
    MatDatepickerModule,
    MatSnackBarModule
  ],
  templateUrl: './detalle-pedido-dialog.component.html',
  styleUrls: ['./detalle-pedido-dialog.component.css']
})
export class DetallePedidoDialogComponent implements OnInit {
  pedido: PedidoDetalle;
  itemColumns = ['insumo', 'pedido', 'recibido', 'precio', 'vencimiento', 'estado', 'observaciones', 'acciones'];
  itemSeleccionado: ItemPedido | null = null;
  mostrarObservacionModal = false;
  observacionTemp = '';

  constructor(
    private dialogRef: MatDialogRef<DetallePedidoDialogComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.pedido = JSON.parse(JSON.stringify(data.pedido)); // Deep copy
  }

  ngOnInit(): void {
    this.actualizarTotalPedido();
  }

  getEstadoColor(estado: string): string {
    const colores: Record<string, string> = {
      'pendiente': 'warn',
      'recibido': 'accent',
      'verificado': 'primary',
      'incompleto': 'warn',
      'aprobado': 'primary',
      'rechazado': 'warn'
    };
    return colores[estado] || 'basic';
  }

  getEstadoItemColor(estado: string): string {
    const colores: Record<string, string> = {
      'completo': 'primary',
      'incompleto': 'warn',
      'vencido': 'warn',
      'defectuoso': 'warn'
    };
    return colores[estado] || 'basic';
  }

  updateCantidadRecibida(item: ItemPedido, event: Event): void {
    const target = event.target as HTMLInputElement;
    const cantidad = parseInt(target.value) || 0;
    item.cantidadRecibida = Math.min(cantidad, item.cantidadPedida);
    
    if (item.cantidadRecibida < item.cantidadPedida && item.estado === 'completo') {
      item.estado = 'incompleto';
    } else if (item.cantidadRecibida === item.cantidadPedida && item.estado === 'incompleto') {
      item.estado = 'completo';
    }
    
    this.actualizarTotalPedido();
  }

  updateFechaVencimiento(item: ItemPedido, event: Event): void {
    const target = event.target as HTMLInputElement;
    item.fechaVencimiento = target.value;
    
    if (this.isVencido(item.fechaVencimiento)) {
      item.estado = 'vencido';
    }
  }

  updateEstadoItem(item: ItemPedido, event: MatSelectChange): void {
    item.estado = event.value as 'completo' | 'incompleto' | 'vencido' | 'defectuoso';
  }

  isVencido(fecha?: string): boolean {
    if (!fecha) return false;
    const fechaVencimiento = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return fechaVencimiento < hoy;
  }

  puedeAprobar(): boolean {
    return this.pedido.items.every(item => {
      const cantidadCorrecta = item.cantidadRecibida === item.cantidadPedida;
      const estadoCorrecto = item.estado === 'completo';
      const tieneFechaVencimiento = item.fechaVencimiento !== undefined && item.fechaVencimiento !== '';
      const noEstaVencido = !this.isVencido(item.fechaVencimiento);
      
      return cantidadCorrecta && estadoCorrecto && tieneFechaVencimiento && noEstaVencido;
    });
  }

  getMensajeValidacion(): string {
    const itemsIncompletos = this.pedido.items.filter(i => i.cantidadRecibida < i.cantidadPedida);
    const itemsSinFecha = this.pedido.items.filter(i => !i.fechaVencimiento || i.fechaVencimiento === '');
    const itemsVencidos = this.pedido.items.filter(i => this.isVencido(i.fechaVencimiento));
    const itemsProblematicos = this.pedido.items.filter(i => i.estado !== 'completo');
    
    const mensajes: string[] = [];
    
    if (itemsIncompletos.length > 0) {
      mensajes.push(`${itemsIncompletos.length} ítem(s) con cantidad incompleta`);
    }
    if (itemsSinFecha.length > 0) {
      mensajes.push(`${itemsSinFecha.length} ítem(s) sin fecha de vencimiento`);
    }
    if (itemsVencidos.length > 0) {
      mensajes.push(`${itemsVencidos.length} ítem(s) vencido(s)`);
    }
    if (itemsProblematicos.length > 0) {
      mensajes.push(`${itemsProblematicos.length} ítem(s) con problemas`);
    }
    
    if (mensajes.length === 0) {
      return 'Complete todos los campos para aprobar el pedido';
    }
    
    return 'Problemas detectados: ' + mensajes.join(', ');
  }

  abrirObservaciones(item: ItemPedido): void {
    this.itemSeleccionado = item;
    this.observacionTemp = item.observaciones || '';
    this.mostrarObservacionModal = true;
  }

  cerrarModalObservacion(): void {
    this.mostrarObservacionModal = false;
    this.itemSeleccionado = null;
    this.observacionTemp = '';
  }

  guardarObservacion(): void {
    if (this.itemSeleccionado) {
      const observacion = this.observacionTemp.trim();
      
      if (observacion === '') {
        this.snackBar.open('Por favor ingrese una observación', 'Cerrar', {
          duration: 3000,
          panelClass: 'snackbar-warning'
        });
        return;
      }
      
      this.itemSeleccionado.observaciones = observacion;
      this.snackBar.open('Observación guardada exitosamente', 'Cerrar', {
        duration: 3000,
        panelClass: 'snackbar-success'
      });
    }
    this.cerrarModalObservacion();
  }

  aprobarPedido(): void {
    if (!this.puedeAprobar()) {
      this.snackBar.open(this.getMensajeValidacion(), 'Cerrar', {
        duration: 4000,
        panelClass: 'snackbar-warning'
      });
      return;
    }
    
    this.pedido.estado = 'aprobado';
    this.snackBar.open(`Pedido #${this.pedido.id} aprobado como pagable exitosamente`, 'Cerrar', {
      duration: 3000,
      panelClass: 'snackbar-success'
    });
  }

  marcarIncompleto(): void {
    const tieneProblemas = this.pedido.items.some(item => 
      item.estado !== 'completo' || 
      item.cantidadRecibida < item.cantidadPedida
    );
    
    if (!tieneProblemas) {
      this.snackBar.open('Debe marcar al menos un ítem con problemas para registrar el pedido como incompleto', 'Cerrar', {
        duration: 4000,
        panelClass: 'snackbar-warning'
      });
      return;
    }
    
    this.pedido.estado = 'incompleto';
    this.snackBar.open(`Pedido #${this.pedido.id} marcado como incompleto`, 'Cerrar', {
      duration: 3000,
      panelClass: 'snackbar-warning'
    });
  }

  rechazarPedido(): void {
    this.pedido.estado = 'rechazado';
    this.snackBar.open(`Pedido #${this.pedido.id} rechazado`, 'Cerrar', {
      duration: 3000,
      panelClass: 'snackbar-warning'
    });
  }

  private actualizarTotalPedido(): void {
    this.pedido.total = this.pedido.items.reduce((total, item) => {
      return total + (item.cantidadRecibida * item.precioUnitario);
    }, 0);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.dialogRef.close(this.pedido);
  }
}