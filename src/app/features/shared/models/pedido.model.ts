// src/app/shared/models/pedido.model.ts

export interface OrdenCompra {
  id: number;
  orderId?: number; // Alias para compatibilidad
  externalReference: string;
  status?: PaymentStatus; // Estado de pago (de tu OrdenCompra original)
  paymentStatus?: PaymentStatus; // Estado de pago (en respuesta delivery)
  deliveryStatus?: DeliveryStatus; // Estado de entrega
  paymentId?: string;
  total: number;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  fechaAsignacion?: string;
  fechaAsignacionRepartidor?: string;
  payerEmail?: string;
  trackingCode?: string;
  items?: ItemOrden[];
  direccionEntrega?: string;
  fechaEntregaEstimada?: string;
  repartidor?: Repartidor; // ← AGREGAR ESTO
}

// ← AGREGAR ESTE INTERFACE
export interface Repartidor {
  id: number;
  nombre: string;
  telefono?: string;
  email?: string;
}

export interface ItemOrden {
  id?: number;
  producto?: string;
  productoNombre?: string;
  nombre?: string; // 
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  imagen?: string;
}

// Estados de pago (del backend)
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'IN_PROCESS';

export const PaymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  FAILED: 'Fallido',
  CANCELLED: 'Cancelado',
  IN_PROCESS: 'En proceso'
};

// Estados de entrega (del backend)
export type DeliveryStatus = 'PREPARING' | 'READY' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';

export const DeliveryStatusLabels: Record<DeliveryStatus, string> = {
  PREPARING: 'En preparación',
  READY: 'Listo para envío',
  IN_TRANSIT: 'En camino',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado'
};

export interface DeliveryUpdate {
  orderId: number;
  newStatus: DeliveryStatus;
  comentario?: string;
}

export interface OrdenCompra {
  id: number;
  orderId?: number;
  externalReference: string;
  status?: PaymentStatus;
  paymentStatus?: PaymentStatus;
  deliveryStatus?: DeliveryStatus;
  paymentId?: string;
  total: number;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  fechaAsignacion?: string;
  fechaAsignacionRepartidor?: string;
  payerEmail?: string;
  trackingCode?: string;
  items?: ItemOrden[];
  direccionEntrega?: string;
  fechaEntregaEstimada?: string;
  repartidor?: Repartidor; // ← AGREGAR ESTA LÍNEA
}

// Respuesta del endpoint /status
export interface OrderStatusResponse {
  orderId: number;
  status: PaymentStatus;
  total: number;
  paymentId?: string;
  fechaCreacion: string;
  items: Array<{
    producto: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }>;
}