# Módulo de Accesibilidad

Este módulo proporciona controles para mejorar la accesibilidad de la aplicación OldBaker, permitiendo a los usuarios ajustar el tamaño de la letra y activar el modo de alto contraste.

## Características

- **Tamaño de letra ajustable**: Pequeño, Mediano (por defecto), Grande
- **Modo de alto contraste**: Para usuarios con problemas de visión
- **Persistencia**: Las preferencias se guardan en localStorage
- **Responsive**: Se adapta a dispositivos móviles
- **Accesible**: Implementado siguiendo las mejores prácticas WCAG

## Estructura de archivos

```
src/app/shared/accessibility/
├── accessibility.service.ts              # Servicio principal
├── accessibility.service.spec.ts         # Tests del servicio
├── accessibility-panel.component.ts      # Componente del panel de control
├── accessibility-panel.component.html    # Template del panel
└── accessibility-panel.component.css     # Estilos del panel
```

## Uso

### 1. Inicialización automática

El servicio se inicializa automáticamente en `AppComponent` para cargar las preferencias guardadas del usuario:

```typescript
export class AppComponent implements OnInit {
  constructor(private accessibilityService: AccessibilityService) {}

  ngOnInit() {
    this.accessibilityService.init();
  }
}
```

### 2. Panel de control en el Header

El panel de accesibilidad está integrado en el header y es visible en todas las páginas:

```html
<app-accessibility-panel></app-accessibility-panel>
```

### 3. Uso programático del servicio

Puedes usar el servicio en cualquier componente:

```typescript
import { AccessibilityService } from './shared/accessibility/accessibility.service';

export class MiComponente {
  constructor(private a11y: AccessibilityService) {}

  cambiarTamaño() {
    this.a11y.setFontSize('large');
  }

  activarContraste() {
    this.a11y.setContrast(true);
  }

  obtenerConfig() {
    const size = this.a11y.getFontSize();
    const contrast = this.a11y.isHighContrast();
  }
}
```

## API del Servicio

### Métodos de Tamaño de Letra

- `setFontSize(size: FontSize)`: Establece el tamaño ('small' | 'medium' | 'large')
- `getFontSize(): FontSize`: Obtiene el tamaño actual
- `toggleFontSize()`: Alterna entre los tres tamaños

### Métodos de Contraste

- `setContrast(enabled: boolean)`: Activa/desactiva alto contraste
- `isHighContrast(): boolean`: Verifica si el alto contraste está activo
- `toggleContrast()`: Alterna el modo de alto contraste

### Otros

- `init()`: Inicializa y carga preferencias guardadas
- `reset()`: Restablece a valores por defecto

## Estilos Globales

Los estilos en `src/styles.css` aplican los cambios a toda la aplicación:

### Variables CSS

```css
:root {
  --base-font-size: 16px;
  --a11y-focus: #005fcc;
}
```

### Clases aplicadas al `<html>`

- `.a11y-font-size-small`: Tamaño de fuente 14px
- `.a11y-font-size-medium`: Tamaño de fuente 16px (por defecto)
- `.a11y-font-size-large`: Tamaño de fuente 20px
- `.a11y-high-contrast`: Modo de alto contraste

## Personalización

### Ajustar tamaños de fuente

Modifica las variables en `src/styles.css`:

```css
html.a11y-font-size-small {
  --base-font-size: 12px; /* Cambiar según necesidad */
}
```

### Personalizar colores de alto contraste

Ajusta los estilos en `src/styles.css`:

```css
html.a11y-high-contrast {
  background: #000 !important;
  color: #fff !important;
}
```

### Agregar más elementos al alto contraste

Añade reglas específicas para tus componentes:

```css
html.a11y-high-contrast .mi-componente {
  background: #111 !important;
  border: 2px solid #fff !important;
}
```

## Mejores Prácticas

1. **Usa unidades `rem`** en tus componentes en lugar de `px` para que escalen correctamente con el tamaño de fuente base
2. **Mantén suficiente contraste** incluso en modo normal (mínimo 4.5:1 para texto)
3. **Prueba con lectores de pantalla** para asegurar la accesibilidad completa
4. **No uses solo color** para transmitir información importante

## Testing

Ejecuta las pruebas del servicio:

```bash
ng test --include='**/accessibility.service.spec.ts'
```

## Compatibilidad

- Angular 17+
- Todos los navegadores modernos
- Compatible con lectores de pantalla

## Soporte

Para más información sobre accesibilidad web, consulta:
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Angular Accessibility](https://angular.io/guide/accessibility)

