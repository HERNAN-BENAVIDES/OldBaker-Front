import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ShoppingCartService } from '../shopping-cart/shopping-cart.service';
import { ProductosService, Producto } from '../../services/productos.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
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
          <article class="product" *ngFor="let p of products" (click)="viewProductDetail(p.id)" style="cursor: pointer;">
            <div class="product-image">
              <img [src]="p.image" [alt]="p.nombre" (error)="onImageError($event)" />
            </div>
            <div class="product-body">
              <h3 class="product-name">{{ p.nombre }}</h3>
              <p class="product-desc">Pedido mínimo: {{ p.minimumOrder || 1 }} unidades</p>
              <span class="category">{{ p.categoriaNombre }}</span>
              <span class="price">{{ p.price | currency:'COP':'symbol':'1.0-0' }}</span>
              <button class="btn small" (click)="addToCart(p); $event.stopPropagation()">Agregar</button>
            </div>
          </article>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./home.css']
})
export class Home implements OnInit {
  products: any[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private cartService: ShoppingCartService,
    private productosService: ProductosService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.loading = true;
    this.error = null;

    this.productosService.getProductos().subscribe({
      next: (productos: Producto[]) => {
        // Guardar productos originales en cache para acceso desde página de detalle
        sessionStorage.setItem('productos_cache', JSON.stringify(productos));

        // Mapear productos de la API usando la URL del backend
        this.products = productos.map(p => ({
          id: p.idProducto,
          nombre: p.nombre,
          descripcion: p.descripcion,
          price: p.costoUnitario,
          categoriaNombre: p.categoriaNombre,
          vidaUtilDias: p.vidaUtilDias,
          image: p.url, // Usar la URL que viene del backend
          minimumOrder: p.pedidoMinimo || 1 // Agregar el pedido mínimo
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
    const quantity = product.minimumOrder || 1;
    // Agregar la cantidad mínima requerida al carrito
    for (let i = 0; i < quantity; i++) {
      this.cartService.addItem({
        id: product.id,
        name: product.nombre,
        price: product.price,
        image: product.image
      });
    }
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'https://via.placeholder.com/300x200?text=Producto';
    }
  }

  viewProductDetail(productId: number) {
    // Navegar al detalle del producto
    this.router.navigate(['/product-detail', productId]);
  }
}
