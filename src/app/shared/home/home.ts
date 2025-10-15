import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, Header, Footer],
  template: `
    <app-header></app-header>
    <section class="home-hero">
      <h2 class="products-title">Nuestros productos</h2>
      <div class="products-bg">
        <div class="products-grid">
          <article class="product" *ngFor="let p of products">
            <div class="product-image">
              <img [src]="p.image" [alt]="p.name" (error)="onImageError($event)" />
            </div>
            <div class="product-body">
              <h3 class="product-name">{{ p.name }}</h3>
              <p class="product-desc">{{ p.description }}</p>
              <span class="price">{{ p.price | currency:'COP':'symbol':'1.0-0' }}</span>
              <button class="btn small">Agregar</button>
            </div>
          </article>
        </div>
      </div>
    </section>
    <app-footer></app-footer>
  `,
  styleUrls: ['./home.css']
})
export class Home {
  // Lista de ejemplo con 10 productos de panadería
  products = [
    { id: 1, name: 'Pan de masa madre', description: 'Pan crujiente por fuera y esponjoso por dentro.', price: 4800, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRaYVIHjnhL9jbfze-zBwptyRbDu_49IrxpPA&s' },
    { id: 2, name: 'Baguette clásica', description: 'Baguette francesa recién horneada.', price: 2200, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT7lqlhO7l4XsKhqzPuv3wXVV6TYSAOrrXYvw&s' },
    { id: 3, name: 'Croissant mantequilla', description: 'Hojaldrado y hojaldrado, con mantequilla natural.', price: 3500, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTDErtm8lw1Se54oRVLopzjS8FJaJXafFf0AQ&s' },
    { id: 4, name: 'Pan integral', description: 'Pan saludable con harina integral y semillas.', price: 4200, image: 'https://i.ytimg.com/vi/JyfZNeU6jYc/maxresdefault.jpg' },
    { id: 5, name: 'Churros', description: 'Churros recién fritos, perfectos con chocolate.', price: 1800, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMmatyqZovCKIc1sHWqs_OWBp_H7xbp1Gfxw&s' },
    { id: 6, name: 'Medialuna', description: 'Medialuna dulce con un glaseado ligero.', price: 1400, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQmEuqXgluFVoY1dSTvOfB-N4p01LJHGmoeYQ&s' },
    { id: 7, name: 'Pan de queso', description: 'Delicioso pan relleno de queso fundido.', price: 2600, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_iNDGne36JsXZiMRHHXMckDkChXc-1T78Iw&s' },
    { id: 8, name: 'Tortas individuales', description: 'Tortas pequeñas con crema y frutas.', price: 6800, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRTEV42alpfIkcv9xz2xBCoQUheKWxaKbgBQg&s' },
    { id: 9, name: 'Brownie', description: 'Brownie chocolatoso, con nueces opcionales.', price: 3000, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWl7RzquqQtLOBuIIfp5NTfgHw-WqTSiNBOg&s' },
    { id: 10, name: 'Pan de chocolate', description: 'Pan relleno de trozos de chocolate.', price: 3200, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSDGxXUfHBSJIJ0HhXGezGo16995ugpcD85Dw&s' }
  ];

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = '/assets/placeholder.png';
    }
  }
}
