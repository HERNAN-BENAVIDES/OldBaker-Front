import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

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
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {
  registerForm: FormGroup;
  hidePassword = true;

  constructor(private fb: FormBuilder, private router: Router) {
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
    alert('Registrarse con Google (simulado)');
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    const { nombre, email } = this.registerForm.value;
    console.log('Registrando', nombre, email);
    // Simular flujo: navegar a / después de registro exitoso
    this.router.navigate(['/']);
  }

  get nombre() { return this.registerForm.get('nombre'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
}
