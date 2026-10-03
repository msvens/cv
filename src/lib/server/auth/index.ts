import type { Handle } from '@sveltejs/kit';
import { betterAuth } from 'better-auth';
import { createAuthMiddleware } from 'better-auth/api';
import { svelteKitHandler, sveltekitCookies } from 'better-auth/svelte-kit';
import { building } from '$app/env';
import {
	BETTER_AUTH_SECRET,
	BETTER_AUTH_URL,
	GITHUB_CLIENT_ID,
	GITHUB_CLIENT_SECRET
} from '$app/env/private';
import { getRequestEvent } from '$app/server';
import { fillGithubIfEmpty } from '$lib/server/services/profile';
import { allowAccountCreation, allowUserCreation, githubFields, isAdminGithubId } from './admin';

/**
 * GitHub sign-in for the single admin, stateless: no database. The session lives in an
 * encrypted cookie; Better Auth keeps users/accounts in memory (lost on restart, which the
 * cookie survives). Same model as the old app's JWT sessions — nothing is added to the DB.
 */
export const auth = betterAuth({
	baseURL: BETTER_AUTH_URL,
	secret: BETTER_AUTH_SECRET,
	telemetry: { enabled: false },
	socialProviders: {
		github: {
			clientId: GITHUB_CLIENT_ID,
			clientSecret: GITHUB_CLIENT_SECRET,
			// Keep the GitHub identity on the user: the numeric ID for the admin check, the
			// login for filling in profile.github.
			mapProfileToUser: (profile) => ({
				githubId: String(profile.id),
				githubLogin: profile.login
			})
		}
	},
	user: {
		additionalFields: {
			// Not `input: false`: Better Auth applies that filter to the provider's mapped profile
			// too, so the fields would never arrive. Instead the only endpoint that lets a user
			// write their own fields is disabled below — they can only come from GitHub.
			githubId: { type: 'string', required: false },
			githubLogin: { type: 'string', required: false }
		}
	},
	disabledPaths: ['/update-user'],
	// First layer: nobody but the admin gets a user or a GitHub account record, so sign-in
	// fails for them (returning false blocks the creation). The guard re-checks every request.
	databaseHooks: {
		user: { create: { before: async (user) => allowUserCreation(user) } },
		account: { create: { before: async (account) => allowAccountCreation(account) } }
	},
	hooks: {
		after: createAuthMiddleware(async (ctx) => {
			if (!ctx.path.startsWith('/callback/')) return;
			const { githubId, githubLogin } = githubFields(ctx.context.newSession?.user);
			if (isAdminGithubId(githubId) && githubLogin) await fillGithubIfEmpty(githubLogin);
		})
	},
	// Lets sign-in/sign-out called from form actions set their cookies; must be last.
	plugins: [sveltekitCookies(getRequestEvent)]
});

/** Serves /api/auth/* and puts the current session (if any) on `locals`. */
export const authHandle: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });
	event.locals.user = session?.user ?? null;
	event.locals.session = session?.session ?? null;
	return svelteKitHandler({ event, resolve, auth, building });
};
