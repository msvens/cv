export type Language = 'en' | 'sv';

export const DEFAULT_LANGUAGE: Language = 'en';

export function isLanguage(value: unknown): value is Language {
	return value === 'en' || value === 'sv';
}

/** BCP 47 locale for Intl APIs — always region-qualified (`sv-SE`, not `sv`). */
export function localeOf(lang: Language): string {
	return lang === 'sv' ? 'sv-SE' : 'en-US';
}
