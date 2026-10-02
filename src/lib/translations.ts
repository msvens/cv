import type { Language } from '$lib/i18n';

export interface Translations {
	topBar: {
		downloadPdf: string;
		available: string;
		switchTo: string;
		toggleTheme: string;
		menu: string;
		darkMode: string;
		lightMode: string;
	};
	resume: {
		present: string;
	};
}

const translations: Record<Language, Translations> = {
	en: {
		topBar: {
			downloadPdf: 'PDF',
			available: 'Available',
			switchTo: 'Switch to',
			toggleTheme: 'Toggle theme',
			menu: 'Menu',
			darkMode: 'Dark mode',
			lightMode: 'Light mode'
		},
		resume: {
			present: 'Present'
		}
	},
	sv: {
		topBar: {
			downloadPdf: 'PDF',
			available: 'Tillgänglig',
			switchTo: 'Byt till',
			toggleTheme: 'Växla tema',
			menu: 'Meny',
			darkMode: 'Mörkt läge',
			lightMode: 'Ljust läge'
		},
		resume: {
			present: 'Nuvarande'
		}
	}
};

export function getTranslation(lang: Language): Translations {
	return translations[lang];
}
