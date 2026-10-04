// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Language } from '$lib/i18n';
import type { auth } from '$lib/server/auth';

type AuthSession = typeof auth.$Infer.Session;

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			/** Resolved from the `lang` cookie in hooks.server.ts. */
			lang: Language;
			/** The signed-in user, from the session cookie (null when signed out). */
			user: AuthSession['user'] | null;
			session: AuthSession['session'] | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
