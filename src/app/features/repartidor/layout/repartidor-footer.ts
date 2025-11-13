import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-repartidor-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="rep-footer">
      <small>© {{year}} OldBaker · Repartos</small>
    </footer>
  `,
  styles: [`
    .rep-footer { position:fixed; left:0; right:0; bottom:0; padding:18px 20px; background:#2563eb; color:#e5edff; text-align:center; }
  `]
})
export class RepartidorFooter { year = new Date().getFullYear(); }
