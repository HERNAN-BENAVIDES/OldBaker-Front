import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/components/login/login').then(m => m.Login)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/components/register/register').then(m => m.Register)
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/proveedores/proveedores')
      .then(c => c.AdminProveedoresComponent) // ✅ Cambiado a AdminProveedoresComponent
  },
  {
    path: 'admin/proveedores',
    loadComponent: () => import('./features/admin/proveedores/proveedores')
      .then(c => c.AdminProveedoresComponent) // ✅ Cambiado a AdminProveedoresComponent
  },
  {
    path: 'admin/dashboard',
    redirectTo: 'admin',
    pathMatch: 'full'
  },
  // 🚀 AGREGAR ESTA RUTA
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
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/login'
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];