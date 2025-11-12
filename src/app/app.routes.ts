import { Routes } from '@angular/router';
import { AuthGuard } from './features/auth/services/auth.guard';
import { StaffRedirectGuard } from './features/auth/services/staff-redirect.guard';
import { AlreadyAuthGuard } from './features/auth/services/already-auth.guard';

export const routes: Routes = [
  // Redirección a /home como ruta por defecto
  { path: '', pathMatch: 'full', redirectTo: 'home' },

  // Ruta principal - Home (pública con redirección para staff)
  {
    path: 'home',
    loadComponent: () => import('./shared/home/home')
      .then(m => m.Home),
    canActivate: [StaffRedirectGuard]
  },
  // Detalle de producto (pública)
  {
    path: 'product-detail/:id',
    loadComponent: () => import('./shared/producto-detalle/producto-detalle.component')
      .then(m => m.ProductoDetalleComponent)
  },

  // Página de Carrito (pública)
  {
    path: 'cart',
    loadComponent: () => import('./features/cart/cart-page.component')
      .then(m => m.CartPageComponent)
  },

  // Checkout - Dirección (accesible; validación de login ocurre en el componente antes de pagar)
  {
    path: 'checkout/address',
    loadComponent: () => import('./features/checkout/checkout-address.component')
      .then(m => m.CheckoutAddressComponent)
  },

  // Rutas de autenticación (públicas): bloqueadas si ya estás autenticado
  {
    path: 'login',
    loadComponent: () => import('./features/auth/components/login/login')
      .then(m => m.Login),
    canActivate: [AlreadyAuthGuard]
  },
  {
    path: 'auth/worker/login',
    loadComponent: () => import('./features/auth/components/worker-login/worker-login')
      .then(m => m.WorkerLoginComponent),
    canActivate: [AlreadyAuthGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/components/register/register')
      .then(m => m.Register),
    canActivate: [AlreadyAuthGuard]
  },
  {
    path: 'verify',
    loadComponent: () => import('./features/auth/components/verify/verify')
      .then(m => m.Verify),
    canActivate: [AlreadyAuthGuard]
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/components/forgot-password/forgot-password')
      .then(m => m.ForgotPasswordComponent),
    canActivate: [AlreadyAuthGuard]
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/components/reset-password/reset-password')
      .then(m => m.ResetPasswordComponent),
    canActivate: [AlreadyAuthGuard]
  },
  {
    path: 'code-password',
    loadComponent: () => import('./features/auth/components/code-password/code-password')
      .then(m => m.CodePassword),
    canActivate: [AlreadyAuthGuard]
  },
  {
    path: 'oauth-callback',
    loadComponent: () => import('./features/auth/components/oauth-callback/oauth-callback')
      .then(m => m.OauthCallback),
    canActivate: [AlreadyAuthGuard]
  },
  { path: 'forgot', redirectTo: 'forgot-password' },
  { path: 'worker', pathMatch: 'full', redirectTo: 'auth/worker/login' },
  { path: 'workers', pathMatch: 'full', redirectTo: 'auth/worker/login' },
  { path: 'worker/login', pathMatch: 'full', redirectTo: 'auth/worker/login' },
  { path: 'workers/login', pathMatch: 'full', redirectTo: 'auth/worker/login' },
  { path: 'workers/auth/login', pathMatch: 'full', redirectTo: 'auth/worker/login' },

  // Rutas de administrador (protegidas)
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/proveedores/proveedores')
      .then(c => c.AdminProveedoresComponent),
    canActivate: [AuthGuard],
    data: { roles: ['ADMINISTRADOR', 'ADMIN'] }
  },
  {
    path: 'admin/proveedores',
    loadComponent: () => import('./features/admin/proveedores/proveedores')
      .then(c => c.AdminProveedoresComponent),
    canActivate: [AuthGuard],
    data: { roles: ['ADMINISTRADOR', 'ADMIN'] }
  },
  {
    path: 'admin/:module',
    loadComponent: () => import('./features/admin/proveedores/proveedores')
      .then(c => c.AdminProveedoresComponent),
    canActivate: [AuthGuard],
    data: { roles: ['ADMINISTRADOR', 'ADMIN'] }
  },
  {
    path: 'admin/dashboard',
    loadComponent: () => import('./features/admin/proveedores/proveedores')
      .then(c => c.AdminProveedoresComponent),
    canActivate: [AuthGuard],
    data: { roles: ['ADMINISTRADOR', 'ADMIN'] }
  },

  // Rutas de auxiliar (protegidas)
  {
    path: 'auxiliar',
    loadComponent: () => import('./features/auxiliar/auxiliar-dashboard/auxiliar-dashboard')
      .then(c => c.AuxiliarDashboardComponent),
    canActivate: [AuthGuard],
    data: { roles: ['AUXILIAR'] }
  },
  {
    path: 'auxiliar/:module',
    loadComponent: () => import('./features/auxiliar/auxiliar-dashboard/auxiliar-dashboard')
      .then(c => c.AuxiliarDashboardComponent),
    canActivate: [AuthGuard],
    data: { roles: ['AUXILIAR'] }
  },
  {
    path: 'auxiliar/detalles-pedidos',
    loadComponent: () => import('./features/auxiliar/detalles-pedidos/detalles-pedidos.component')
      .then(c => c.DetallesPedidosComponent),
    canActivate: [AuthGuard],
    data: { roles: ['AUXILIAR'] }
  },
  {
    path: 'auxiliar/pedidos-insumos',
    loadComponent: () => import('./features/auxiliar/pedidos-insumos/pedidos-insumos.component')
      .then(c => c.PedidosInsumosComponent),
    canActivate: [AuthGuard],
    data: { roles: ['AUXILIAR'] }
  },
  {
    path: 'auxiliar/reportes-proveedores',
    loadComponent: () => import('./features/auxiliar/reportes-proveedores/reportes-proveedores.component')
      .then(c => c.ReportesProveedoresComponent),
    canActivate: [AuthGuard],
    data: { roles: ['AUXILIAR'] }
  },

  // Rutas de cliente (protegidas)
  {
    path: 'mis-pedidos',
    loadComponent: () => import('./features/mis-pedidos/mis-pedidos.component')
      .then(m => m.MisPedidosComponent),
    canActivate: [AuthGuard],
    data: { roles: ['CLIENTE'] }
  },
  {
    path: 'mis-pedidos/detalle-pedido/:external_reference',
    loadComponent: () => import('./features/mis-pedidos/detalle-pedido')
      .then(m => m.PedidoDetalleComponent),
    canActivate: [AuthGuard],
    data: { roles: ['CLIENTE'] }
  },
  {
    path: 'mi-perfil',
    loadComponent: () => import('./features/perfil/perfil.component')
      .then(m => m.PerfilComponent),
    canActivate: [AuthGuard],
    data: { roles: ['CLIENTE'] }
  },

  // Wildcard: componente de redirect inteligente
  {
    path: '**',
    loadComponent: () => import('./shared/route-redirect/route-redirect.component')
      .then(m => m.RouteRedirectComponent)
  }
];
