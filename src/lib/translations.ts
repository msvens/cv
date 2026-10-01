import type { Language } from '$lib/i18n';

export interface Translations {
	topBar: {
		downloadPdf: string;
		available: string;
	};
	resume: {
		present: string;
	};
}

const translations: Record<Language, Translations> = {
	en: {
		topBar: {
			downloadPdf: 'PDF',
			available: 'Available'
		},
		resume: {
			present: 'Present'
		}
	},
	sv: {
		topBar: {
			downloadPdf: 'PDF',
			available: 'Tillgänglig'
		},
		resume: {
			present: 'Nuvarande'
		}
	}
};

export function getTranslation(lang: Language): Translations {
	return translations[lang];
}
