import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Producto {
  idProducto: number;
  nombre: string;
  descripcion: string;
  costoUnitario: number;
  vidaUtilDias: string;
  categoriaNombre: string;
  url: string;
  pedidoMinimo?: number; // Agregar campo pedido mínimo
}

export interface RecetaItem {
  idReceta: number;
  insumoNombre: string;
  cantidadInsumo: number;
  unidadMedida: string;
}

export interface ProductoDetalle {
  idProducto: number;
  nombre: string;
  descripcion: string;
  costoUnitario: number;
  vidaUtilDias: string;
  categoriaNombre: string;
  receta: RecetaItem[];
  pedidoMinimo?: number; // Agregar campo pedido mínimo
  url?: string; // URL de imagen opcional
}

export interface ProductoResponse {
  idProducto: number;
  nombre: string;
  descripcion: string;
  costoUnitario: number;
  vidaUtilDias: number;
  pedidoMinimo?: number;
  categoriaNombre: string;
  receta?: RecetaItem[];
  url?: string; // Campo opcional para URL de imagen si backend lo envía
}

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  private readonly apiUrl = `${environment.apiUrl}/api/productos`;

  constructor(private http: HttpClient) {}

  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl);
  }

  getProductoById(id: number): Observable<ProductoDetalle> {
    return this.http.get<ProductoDetalle>(`${this.apiUrl}/${id}`);
  }

  // Alias de compatibilidad
  getProductoDetalle(id: number): Observable<ProductoDetalle> {
    return this.getProductoById(id);
  }

  // Nuevo: obtener ProductoResponse (mismo endpoint, tipado flexible para incluir url)
  getProductoResponse(id: number): Observable<ProductoResponse> {
    return this.http.get<ProductoResponse>(`${this.apiUrl}/${id}`);
  }
}
