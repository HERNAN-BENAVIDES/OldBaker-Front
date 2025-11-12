import { TestBed } from '@angular/core/testing';
import { ShoppingCartService } from './shopping-cart.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AuthService } from '../../features/auth/services/auth.service';
import { ProductosService } from '../../services/productos.service';

class MockAuthService { getCurrentUser() { return null; } getToken() { return null; } }
class MockProductosService {}

describe('ShoppingCartService', () => {
  let service: ShoppingCartService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ShoppingCartService,
        { provide: AuthService, useClass: MockAuthService },
        { provide: ProductosService, useClass: MockProductosService }
      ]
    });
    service = TestBed.inject(ShoppingCartService);
    // Limpiar almacenamiento para evitar interferencias
    try { localStorage.removeItem('shopping_cart'); } catch {}
  });

  it('debe agregar un nuevo item con cantidad específica', () => {
    service.addItemWithQuantity({ id: 1, name: 'Pan', price: 1000 }, 3);
    service.cartItems$.subscribe(items => {
      expect(items.length).toBe(1);
      expect(items[0].quantity).toBe(3);
    }).unsubscribe();
  });

  it('debe incrementar cantidad si el ítem ya existe', () => {
    service.addItemWithQuantity({ id: 2, name: 'Baguette', price: 2000 }, 2);
    service.addItemWithQuantity({ id: 2, name: 'Baguette', price: 2000 }, 5);
    service.cartItems$.subscribe(items => {
      expect(items[0].quantity).toBe(7);
    }).unsubscribe();
  });

  it('debe normalizar cantidades inválidas a 1', () => {
    service.addItemWithQuantity({ id: 3, name: 'Croissant', price: 3000 }, 0);
    service.cartItems$.subscribe(items => {
      expect(items[0].quantity).toBe(1);
    }).unsubscribe();
  });
});
