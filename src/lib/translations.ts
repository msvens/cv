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
	footer: {
		updated: string;
		admin: string;
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
		footer: {
			updated: 'Updated',
			admin: 'Admin'
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
		footer: {
			updated: 'Uppdaterad',
			admin: 'Admin'
		},
		resume: {
			present: 'Nuvarande'
		}
	}
};

export function getTranslation(lang: Language): Translations {
	return translations[lang];
}
