import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private darkMode = false;
  readonly themeChanged = new Subject<boolean>();

  constructor() {
    this.loadTheme();
  }

  toggleTheme(): void {
    this.darkMode = !this.darkMode;
    this.applyTheme();
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', this.darkMode ? 'dark' : 'light');
    }
  }

  loadTheme(): void {
    if (typeof localStorage === 'undefined') return;
    const saved = localStorage.getItem('theme');
    // Also respect system preference if no saved setting
    const prefersDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    this.darkMode = saved === 'dark' || (!saved && prefersDark);
    this.applyTheme();
  }

  private applyTheme(): void {
    if (typeof document === 'undefined') return;
    if (this.darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    this.themeChanged.next(this.darkMode);
  }

  isDarkMode(): boolean {
    return this.darkMode;
  }
}