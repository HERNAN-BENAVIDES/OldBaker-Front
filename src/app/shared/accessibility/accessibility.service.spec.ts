import { TestBed } from '@angular/core/testing';
import { AccessibilityService, FontSize } from './accessibility.service';

describe('AccessibilityService', () => {
  let service: AccessibilityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AccessibilityService);
    localStorage.clear();
    document.documentElement.className = '';
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with default medium font size', () => {
    service.init();
    expect(service.getFontSize()).toBe('medium');
  });

  it('should set and get font size', () => {
    service.setFontSize('large');
    expect(service.getFontSize()).toBe('large');
    expect(localStorage.getItem('a11y-font-size')).toBe('large');
  });

  it('should toggle font size correctly', () => {
    service.setFontSize('small');
    service.toggleFontSize();
    expect(service.getFontSize()).toBe('medium');

    service.toggleFontSize();
    expect(service.getFontSize()).toBe('large');

    service.toggleFontSize();
    expect(service.getFontSize()).toBe('small');
  });

  it('should set and check high contrast', () => {
    service.setContrast(true);
    expect(service.isHighContrast()).toBe(true);
    expect(document.documentElement.classList.contains('a11y-high-contrast')).toBe(true);
  });

  it('should toggle contrast', () => {
    service.setContrast(false);
    service.toggleContrast();
    expect(service.isHighContrast()).toBe(true);

    service.toggleContrast();
    expect(service.isHighContrast()).toBe(false);
  });

  it('should reset to defaults', () => {
    service.setFontSize('large');
    service.setContrast(true);

    service.reset();

    expect(service.getFontSize()).toBe('medium');
    expect(service.isHighContrast()).toBe(false);
  });
});

