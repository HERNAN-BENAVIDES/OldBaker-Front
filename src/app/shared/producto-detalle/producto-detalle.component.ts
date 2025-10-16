import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductosService, ProductoDetalle } from '../../services/productos.service';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { ShoppingCartService } from '../shopping-cart/shopping-cart.service';

@Component({
  selector: 'app-producto-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule, Header, Footer],
  templateUrl: './producto-detalle.component.html',
  styleUrls: ['./producto-detalle.component.css']
})
export class ProductoDetalleComponent implements OnInit {
  producto: ProductoDetalle | null = null;
  productoUrl: string = '';
  loading = true;
  error: string | null = null;
  quantity: number = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productosService: ProductosService,
    private cartService: ShoppingCartService
  ) {}

  ngOnInit() {
    // Obtener el ID del producto de los parámetros de la ruta
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadProducto(+id);
      } else {
        this.error = 'ID de producto no válido';
        this.loading = false;
      }
    });
  }

  loadProducto(id: number) {
    this.loading = true;
    this.error = null;

    this.productosService.getProductoById(id).subscribe({
      next: (producto) => {
        this.producto = producto;
        // La URL de la imagen viene en la lista de productos, la obtenemos del localStorage o del servicio
        this.productoUrl = this.getProductoImageUrl(id);
        this.loading = false;
        console.log('Producto cargado:', producto);
      },
      error: (err) => {
        this.loading = false;
        console.error('Error al cargar producto:', err);

        if (err.status === 0) {
          this.error = 'No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose.';
        } else if (err.status === 404) {
          this.error = 'Producto no encontrado';
        } else {
          this.error = `Error al cargar el producto (${err.status}): ${err.message}`;
        }
      }
    });
  }

  getProductoImageUrl(id: number): string {
    // Intentar obtener la URL desde el almacenamiento temporal
    const productosStr = sessionStorage.getItem('productos_cache');
    if (productosStr) {
      try {
        const productos = JSON.parse(productosStr);
        const prod = productos.find((p: any) => p.idProducto === id);
        if (prod && prod.url) {
          return prod.url;
        }
      } catch (e) {
        console.error('Error al obtener imagen del cache:', e);
      }
    }
    // Imagen por defecto si no se encuentra
    return 'https://via.placeholder.com/600x400?text=Producto';
  }

  addToCart() {
    if (this.producto && this.quantity > 0) {
      // Agregar múltiples items según la cantidad seleccionada
      for (let i = 0; i < this.quantity; i++) {
        this.cartService.addItem({
          id: this.producto.idProducto,
          name: this.producto.nombre,
          price: this.producto.costoUnitario,
          image: this.productoUrl
        });
      }
      // Resetear cantidad después de agregar
      this.quantity = 1;
    }
  }

  incrementQuantity() {
    if (this.quantity < 99) { // Límite máximo de 99
      this.quantity++;
    }
  }

  decrementQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  goBack() {
    this.router.navigate(['/']);
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'https://via.placeholder.com/600x400?text=Producto';
    }
  }

  getMaxCantidad(): number {
    if (!this.producto || !this.producto.receta || this.producto.receta.length === 0) {
      return 1;
    }
    return Math.max(...this.producto.receta.map(item => item.cantidadInsumo));
  }

  formatUnidadMedida(unidad: string): string {
    const unidades: { [key: string]: string } = {
      'KILOGRAMOS': 'kg',
      'GRAMOS': 'g',
      'LITROS': 'L',
      'MILILITROS': 'ml',
      'UNIDADES': 'ud'
    };
    return unidades[unidad] || unidad.toLowerCase();
  }
}
