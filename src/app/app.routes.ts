import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./shared/home/home').then(m => m.Home) },
  { path: 'login', loadComponent: () => import('./features/auth/components/login/login').then(m => m.Login) },
  { path: 'register', loadComponent: () => import('./features/auth/components/register/register').then(m => m.Register) },
  { path: 'verify', loadComponent: () => import('./features/auth/components/verify/verify').then(m => m.Verify) },
  { path: 'verify/:id', loadComponent: () => import('./features/auth/components/verify/verify').then(m => m.Verify) },
  { path: 'oauth-callback', loadComponent: () => import('./features/auth/components/oauth-callback/oauth-callback').then(m => m.OauthCallback) },
  { path: 'forgot', loadComponent: () => import('./features/auth/components/forgot-password/forgot-password').then(m => m.ForgotPasswordComponent) },
  { path: 'code-password', loadComponent: () => import('./features/auth/components/code-password/code-password').then(m => m.CodePassword) },
  { path: 'reset-password', loadComponent: () => import('./features/auth/components/reset-password/reset-password').then(m => m.ResetPasswordComponent) }
];
