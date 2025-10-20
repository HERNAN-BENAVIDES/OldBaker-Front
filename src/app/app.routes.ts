import { Routes } from '@angular/router';
import { AuthGuard } from './features/auth/services/auth.guard';

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
  {
    path: 'verify',
    loadComponent: () => import('./features/auth/components/verify/verify')
      .then(m => m.Verify)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/components/forgot-password/forgot-password')
      .then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/components/reset-password/reset-password')
      .then(m => m.ResetPasswordComponent)
  },
  {
    path: 'code-password',
    loadComponent: () => import('./features/auth/components/code-password/code-password')
      .then(m => m.CodePassword)
  },
  {
    path: 'oauth-callback',
    loadComponent: () => import('./features/auth/components/oauth-callback/oauth-callback')
      .then(m => m.OauthCallback)
  },

  // Rutas de administrador
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/proveedores/proveedores')
      .then(c => c.AdminProveedoresComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'admin/proveedores',
    loadComponent: () => import('./features/admin/proveedores/proveedores')
      .then(c => c.AdminProveedoresComponent),
    canActivate: [AuthGuard]
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
      .then(c => c.AuxiliarDashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'auxiliar/detalles-pedidos',
    loadComponent: () => import('./features/auxiliar/detalles-pedidos/detalles-pedidos.component')
      .then(c => c.DetallesPedidosComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'auxiliar/pedidos-insumos',
    loadComponent: () => import('./features/auxiliar/pedidos-insumos/pedidos-insumos.component')
      .then(c => c.PedidosInsumosComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'auxiliar/reportes-proveedores',
    loadComponent: () => import('./features/auxiliar/reportes-proveedores/reportes-proveedores.component')
      .then(c => c.ReportesProveedoresComponent),
    canActivate: [AuthGuard]
  },

  // Ruta de pedidos del usuario (protegida)
  {
    path: 'mis-pedidos',
    loadComponent: () => import('./features/mis-pedidos/mis-pedidos.component')
      .then(m => m.MisPedidosComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'mi-perfil',
    loadComponent: () => import('./features/perfil/perfil.component')
      .then(m => m.PerfilComponent),
    canActivate: [AuthGuard]
  },

  // Ruta por defecto para rutas no encontradas
  {
    path: '**',
    redirectTo: ''
  }
];
