import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../../../shared/notification/notification.service';

function passwordStrength(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  if (!value) return null;
  const hasUpper = /[A-Z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  const minLength = value.length >= 8;
  return hasUpper && hasNumber && minLength ? null : { weakPassword: true };
}

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pwd = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pwd === confirm ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {
  registerForm: FormGroup;
  hidePassword = true;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService, private notifications: NotificationService) {
    this.registerForm = this.fb.group({
      // Campos vacíos por defecto; los ejemplos se muestran como placeholders en la plantilla
      nombre: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, passwordStrength]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: passwordsMatch });
  }

  toggleShowPassword() { this.hidePassword = !this.hidePassword; }

  signUpWithGoogle() {
    // Redirige al endpoint de autorización OAuth2 para iniciar flujo con Google
    window.location.href = 'https://localhost:8443/oauth2/authorization/google';
  }

  onSubmit() {
    this.errorMessage = null;
    this.successMessage = null;

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { nombre, email, password } = this.registerForm.value;

    console.log('[Register] submitting', { nombre, email });
    this.isLoading = true;
    this.authService.register({ nombre, email, password }).subscribe({
      next: (res) => {
        console.log('[Register] response', res);
        this.isLoading = false;
        this.successMessage = 'Registro exitoso';
        this.notifications.showSuccess('Registro exitoso. Por favor verifica tu correo.');
        // Intentar navegar y reportar resultado
        this.router.navigate(['/verify']).then(result => console.log('[Register] navigate result', result)).catch(err => console.error('[Register] navigate error', err));
      },
      error: (err) => {
        console.log('[Register] error', err);
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Error en el registro';
        this.notifications.showError(this.errorMessage ?? 'Error en el registro');
        console.error('Registro error', err);
      }
    });
  }

  get nombre() { return this.registerForm.get('nombre'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
}
