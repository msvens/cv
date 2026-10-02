import { invalidateAll } from '$app/navigation';
import { LANGUAGE_COOKIE, type Language } from '$lib/i18n';

/**
 * Switch the site language. The cookie is the only place the language lives: the server
 * reads it in hooks.server.ts, so re-running the loads re-renders in the new language.
 */
export function setLanguage(lang: Language): Promise<void> {
	document.cookie = `${LANGUAGE_COOKIE}=${lang}; path=/; max-age=31536000; SameSite=Lax`;
	return invalidateAll();
}
