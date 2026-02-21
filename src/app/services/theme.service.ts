import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { Platform } from '@ionic/angular';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private renderer: Renderer2;
    private isDark = false;

    constructor(
        private rendererFactory: RendererFactory2,
        private platform: Platform
    ) {
        this.renderer = this.rendererFactory.createRenderer(null, null);
    }

    initTheme() {
        // Check initial system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        this.toggleDarkTheme(prefersDark.matches);

        // Listen for changes
        prefersDark.addEventListener('change', (mediaQuery) => this.toggleDarkTheme(mediaQuery.matches));
    }

    toggleDarkTheme(shouldBeDark: boolean) {
        this.isDark = shouldBeDark;

        // Apply key classes to BOTH html and body to satisfy both Tailwind and Ionic
        // Tailwind config looks for 'dark' on html (darkMode: 'class')
        // Ionic variables often scope to body.dark
        if (shouldBeDark) {
            this.renderer.addClass(document.documentElement, 'dark');
            this.renderer.addClass(document.body, 'dark');
        } else {
            this.renderer.removeClass(document.documentElement, 'dark');
            this.renderer.removeClass(document.body, 'dark');
        }
    }

    isDarkMode(): boolean {
        return this.isDark;
    }
}
