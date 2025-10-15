import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { ShoppingCartService } from '../shopping-cart/shopping-cart.service';
import { ProductosService, Producto } from '../../services/productos.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, Header, Footer],
  template: `
    <app-header></app-header>
    <section class="home-hero">
      <h2 class="products-title">Nuestros productos</h2>

      <!-- Indicador de carga -->
      <div *ngIf="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Cargando productos...</p>
      </div>

      <!-- Mensaje de error -->
      <div *ngIf="error" class="error-container">
        <p>{{ error }}</p>
        <button class="btn-retry" (click)="loadProducts()">Reintentar</button>
      </div>

      <!-- Lista de productos -->
      <div class="products-bg" *ngIf="!loading && !error">
        <div class="products-grid">
          <article class="product" *ngFor="let p of products">
            <div class="product-image">
              <img [src]="p.image" [alt]="p.nombre" (error)="onImageError($event)" />
            </div>
            <div class="product-body">
              <h3 class="product-name">{{ p.nombre }}</h3>
              <p class="product-desc">{{ p.descripcion }}</p>
              <span class="category">{{ p.categoriaNombre }}</span>
              <span class="price">{{ p.price | currency:'COP':'symbol':'1.0-0' }}</span>
              <button class="btn small" (click)="addToCart(p)">Agregar</button>
            </div>
          </article>
        </div>
      </div>
    </section>
    <app-footer></app-footer>
  `,
  styleUrls: ['./home.css']
})
export class Home implements OnInit {
  products: any[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private cartService: ShoppingCartService,
    private productosService: ProductosService
  ) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.loading = true;
    this.error = null;

    this.productosService.getProductos().subscribe({
      next: (productos: Producto[]) => {
        // Mapear productos de la API usando la URL del backend
        this.products = productos.map(p => ({
          id: p.idProducto,
          nombre: p.nombre,
          descripcion: p.descripcion,
          price: p.costoUnitario,
          categoriaNombre: p.categoriaNombre,
          fechaVencimiento: p.fechaVencimiento,
          image: p.url // Usar la URL que viene del backend
        }));
        this.loading = false;
        console.log('Productos cargados exitosamente:', this.products);
      },
      error: (err) => {
        this.loading = false;
        console.error('Error al cargar productos:', err);

        // Verificar si es un problema de CORS o certificado SSL
        if (err.status === 0) {
          this.error = 'No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose en https://localhost:8443';
        } else {
          this.error = `Error al cargar los productos (${err.status}): ${err.message}`;
        }
      }
    });
  }

  addToCart(product: any) {
    this.cartService.addItem({
      id: product.id,
      name: product.nombre,
      price: product.price,
      image: product.image
    });
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'https://via.placeholder.com/300x200?text=Producto';
    }
  }
}
