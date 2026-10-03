import { defineEnvVars } from '@sveltejs/kit/env';
import { z } from 'zod/v4';

// Every environment variable the app reads. SvelteKit validates them when the app builds and
// when it boots, and generates the types for `$app/env/private` from this file alone.
// ORIGIN and PORT are not listed: adapter-node reads those from process.env itself.
export const variables = defineEnvVars({
	DATABASE_URL: { schema: z.url(), description: 'Postgres connection string' },
	BETTER_AUTH_SECRET: {
		schema: z.string().min(32),
		description: 'Encrypts the session cookie (openssl rand -base64 32)'
	},
	BETTER_AUTH_URL: {
		schema: z.url(),
		description: 'Public origin of the app, used to build the OAuth callback URL'
	},
	GITHUB_CLIENT_ID: { description: 'GitHub OAuth app client ID' },
	GITHUB_CLIENT_SECRET: { description: 'GitHub OAuth app client secret' },
	ADMIN_GITHUB_ID: {
		schema: z.string().regex(/^\d+$/, 'numeric GitHub user ID'),
		description: 'The only GitHub account allowed into the admin (numeric ID, not the login)'
	}
});
