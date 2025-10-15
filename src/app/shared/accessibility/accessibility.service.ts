import { Injectable } from '@angular/core';

export type FontSize = 'extra-small' | 'small' | 'medium' | 'large';

@Injectable({
  providedIn: 'root'
})
export class AccessibilityService {
  private readonly FONT_KEY = 'a11y-font-size';
  private readonly CONTRAST_KEY = 'a11y-high-contrast';
  private doc = document.documentElement;

  init() {
    const savedSize = (localStorage.getItem(this.FONT_KEY) as FontSize) || 'medium';
    const savedContrast = localStorage.getItem(this.CONTRAST_KEY) === 'true';
    this.applyFontSize(savedSize);
    this.setContrast(savedContrast);
  }

  setFontSize(size: FontSize) {
    localStorage.setItem(this.FONT_KEY, size);
    this.applyFontSize(size);
  }

  getFontSize(): FontSize {
    return (localStorage.getItem(this.FONT_KEY) as FontSize) || 'medium';
  }

  increaseFontSize() {
    const current = this.getFontSize();
    const sizes: FontSize[] = ['extra-small', 'small', 'medium', 'large'];
    const currentIndex = sizes.indexOf(current);
    if (currentIndex < sizes.length - 1) {
      this.setFontSize(sizes[currentIndex + 1]);
    }
  }

  decreaseFontSize() {
    const current = this.getFontSize();
    const sizes: FontSize[] = ['extra-small', 'small', 'medium', 'large'];
    const currentIndex = sizes.indexOf(current);
    if (currentIndex > 0) {
      this.setFontSize(sizes[currentIndex - 1]);
    }
  }

  toggleFontSize() {
    const next: Record<FontSize, FontSize> = {
      'extra-small': 'small',
      small: 'medium',
      medium: 'large',
      large: 'extra-small'
    };
    this.setFontSize(next[this.getFontSize()]);
  }

  private applyFontSize(size: FontSize) {
    this.doc.classList.remove('a11y-font-size-extra-small', 'a11y-font-size-small', 'a11y-font-size-medium', 'a11y-font-size-large');
    this.doc.classList.add(`a11y-font-size-${size}`);
  }

  setContrast(enabled: boolean) {
    localStorage.setItem(this.CONTRAST_KEY, String(enabled));
    if (enabled) {
      this.doc.classList.add('a11y-high-contrast');
    } else {
      this.doc.classList.remove('a11y-high-contrast');
    }
  }

  toggleContrast() {
    this.setContrast(!this.isHighContrast());
  }

  isHighContrast(): boolean {
    return this.doc.classList.contains('a11y-high-contrast') ||
           localStorage.getItem(this.CONTRAST_KEY) === 'true';
  }

  reset() {
    this.setFontSize('medium');
    this.setContrast(false);
  }
}
