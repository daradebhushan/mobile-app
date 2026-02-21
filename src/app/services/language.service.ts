import { Injectable, signal } from '@angular/core';
import { TRANSLATIONS } from '../shared/translations';

export type Language = 'EN' | 'MR';

@Injectable({
    providedIn: 'root'
})
export class LanguageService {
    // Use Signals for reactivity
    currentLang = signal<Language>('EN');

    constructor() {
        console.log('LanguageService init. Available Langs:', Object.keys(TRANSLATIONS));
        // Check local storage
        const saved = localStorage.getItem('app_language') as Language;
        if (saved && (saved === 'EN' || saved === 'MR')) {
            this.currentLang.set(saved);
        }
    }

    setLanguage(lang: Language) {
        this.currentLang.set(lang);
        localStorage.setItem('app_language', lang);
    }

    toggleLanguage() {
        const newLang = this.currentLang() === 'EN' ? 'MR' : 'EN';
        this.setLanguage(newLang);
    }

    translate(key: string): string {
        const lang = this.currentLang();
        // @ts-ignore
        const translated = TRANSLATIONS[lang][key];
        return translated || key;
    }
}
