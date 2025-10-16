import { Routes } from '@angular/router';

export const routes: Routes = [
  // Ruta principal - Home
  {
    path: '',
    loadComponent: () => import('./shared/home/home')
      .then(m => m.Home)
  },
  {
    path: 'product-detail/:id',
    loadComponent: () => import('./shared/producto-detalle/producto-detalle.component')
      .then(m => m.ProductoDetalleComponent)
  },

  // Rutas de autenticación - CORREGIDAS
  {
    path: 'login',
    loadComponent: () => import('./features/auth/components/login/login')
      .then(m => m.Login)
  },
  {
    path: 'auth/worker/login',
    loadComponent: () => import('./features/auth/components/worker-login/worker-login')
      .then(m => m.WorkerLoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/components/register/register')
      .then(m => m.Register)
  },

  // Rutas de administrador
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/proveedores/proveedores')
      .then(c => c.AdminProveedoresComponent)
  },
  {
    path: 'admin/proveedores',
    loadComponent: () => import('./features/admin/proveedores/proveedores')
      .then(c => c.AdminProveedoresComponent)
  },
  {
    path: 'admin/dashboard',
    redirectTo: 'admin',
    pathMatch: 'full'
  },

  // Rutas de auxiliar
  {
    path: 'auxiliar',
    loadComponent: () => import('./features/auxiliar/auxiliar-dashboard/auxiliar-dashboard')
      .then(c => c.AuxiliarDashboardComponent)
  },
  {
    path: 'auxiliar/detalles-pedidos',
    loadComponent: () => import('./features/auxiliar/detalles-pedidos/detalles-pedidos.component')
      .then(c => c.DetallesPedidosComponent)
  },
  {
    path: 'auxiliar/pedidos-insumos',
    loadComponent: () => import('./features/auxiliar/pedidos-insumos/pedidos-insumos.component')
      .then(c => c.PedidosInsumosComponent)
  },
  {
    path: 'auxiliar/reportes-proveedores',
    loadComponent: () => import('./features/auxiliar/reportes-proveedores/reportes-proveedores.component')
      .then(c => c.ReportesProveedoresComponent)
  },

  // Ruta de pedidos del usuario
  {
    path: 'mis-pedidos',
    loadComponent: () => import('./features/mis-pedidos/mis-pedidos.component')
      .then(m => m.MisPedidosComponent)
  },
  {
    path: 'mi-perfil',
    loadComponent: () => import('./features/perfil/perfil.component')
      .then(m => m.PerfilComponent)
  },

  // Ruta por defecto para rutas no encontradas
  {
    path: '**',
    redirectTo: ''
  }
];
