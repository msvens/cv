import type { Language } from '$lib/i18n';

export interface Translations {
	topBar: {
		downloadPdf: string;
		sourceCode: string;
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
			sourceCode: 'Source',
			available: 'Available'
		},
		resume: {
			present: 'Present'
		}
	},
	sv: {
		topBar: {
			downloadPdf: 'PDF',
			sourceCode: 'Källa',
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
