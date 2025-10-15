import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccessibilityService, FontSize } from './accessibility.service';
import { LucideAngularModule, Sun, Moon, Minus, Plus, Accessibility } from 'lucide-angular';

@Component({
  selector: 'app-accessibility-panel',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './accessibility-panel.component.html',
  styleUrls: ['./accessibility-panel.component.css']
})
export class AccessibilityPanelComponent implements OnInit {
  fontSize: FontSize = 'medium';
  highContrast = false;
  isOpen = false;

  // Íconos de Lucide
  readonly Sun = Sun;
  readonly Moon = Moon;
  readonly Minus = Minus;
  readonly Plus = Plus;
  readonly Accessibility = Accessibility;

  constructor(private a11y: AccessibilityService) {}

  ngOnInit() {
    this.a11y.init();
    this.fontSize = this.a11y.getFontSize();
    this.highContrast = this.a11y.isHighContrast();
  }

  toggleMenu() {
    this.isOpen = !this.isOpen;
  }

  increaseFontSize() {
    this.a11y.increaseFontSize();
    this.fontSize = this.a11y.getFontSize();
  }

  decreaseFontSize() {
    this.a11y.decreaseFontSize();
    this.fontSize = this.a11y.getFontSize();
  }

  toggleContrast() {
    this.a11y.toggleContrast();
    this.highContrast = this.a11y.isHighContrast();
  }

  reset() {
    this.a11y.reset();
    this.fontSize = 'medium';
    this.highContrast = false;
  }

  canIncrease(): boolean {
    return this.fontSize !== 'large';
  }

  canDecrease(): boolean {
    return this.fontSize !== 'extra-small';
  }
}
