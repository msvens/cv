// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Language } from '$lib/i18n';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			/** Resolved from the `lang` cookie in hooks.server.ts. */
			lang: Language;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
