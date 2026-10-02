export type Language = 'en' | 'sv';

export const DEFAULT_LANGUAGE: Language = 'en';

/** Cookie holding the visitor's language; the same name as the old app, so choices carry over. */
export const LANGUAGE_COOKIE = 'lang';

export function isLanguage(value: unknown): value is Language {
	return value === 'en' || value === 'sv';
}

/** The language for a raw cookie value; anything unrecognised falls back to the default. */
export function resolveLanguage(value: string | undefined): Language {
	return isLanguage(value) ? value : DEFAULT_LANGUAGE;
}

/** BCP 47 locale for Intl APIs — always region-qualified (`sv-SE`, not `sv`). */
export function localeOf(lang: Language): string {
	return lang === 'sv' ? 'sv-SE' : 'en-US';
}
