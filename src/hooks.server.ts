import type { Handle } from '@sveltejs/kit';
import { LANGUAGE_COOKIE, resolveLanguage } from '$lib/i18n';

export const handle: Handle = ({ event, resolve }) => {
	event.locals.lang = resolveLanguage(event.cookies.get(LANGUAGE_COOKIE));
	return resolve(event, {
		// Fills the `%lang%` placeholder in app.html, so SSR emits the right <html lang>.
		transformPageChunk: ({ html }) => html.replace('%lang%', event.locals.lang)
	});
};
