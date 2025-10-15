import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Producto {
  idProducto: number;
  nombre: string;
  descripcion: string;
  costoUnitario: number;
  fechaVencimiento: string;
  categoriaNombre: string;
  url: string;
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
}
