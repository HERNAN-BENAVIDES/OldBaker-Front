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
}
