import { Injectable, signal, computed, effect, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private isBrowser: boolean;

  // Signal for theme state
  private _isDarkTheme = signal(false);

  // Computed signal for theme class
  themeClass = computed(() => this._isDarkTheme() ? 'dark' : 'light');

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);

    // Load theme from localStorage on initialization
    if (this.isBrowser) {
      const savedTheme = localStorage.getItem('theme');
      // Default to light theme if no preference is saved
      this._isDarkTheme.set(savedTheme === 'dark');

      // Apply theme immediately on initialization
      this.applyThemeToDocument();
    }

    // Save theme to localStorage whenever it changes
    effect(() => {
      if (this.isBrowser) {
        localStorage.setItem('theme', this._isDarkTheme() ? 'dark' : 'light');
        this.applyThemeToDocument();
      }
    });
  }

  // Get current theme state
  isDarkTheme() {
    return this._isDarkTheme();
  }

  // Toggle theme
  toggleTheme() {
    this._isDarkTheme.update(current => !current);
  }

  // Set specific theme
  setTheme(isDark: boolean) {
    this._isDarkTheme.set(isDark);
  }

  // Apply theme to document element
  private applyThemeToDocument() {
    if (this.isBrowser) {
      const isDark = this._isDarkTheme();
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    }
  }
}
