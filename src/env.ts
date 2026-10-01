import { defineEnvVars } from '@sveltejs/kit/env';
import { z } from 'zod/v4';

// Every environment variable the app reads. SvelteKit validates them when the app builds and
// when it boots, and generates the types for `$app/env/private` from this file alone.
// ORIGIN and PORT are not listed: adapter-node reads those from process.env itself.
export const variables = defineEnvVars({
	DATABASE_URL: { schema: z.url(), description: 'Postgres connection string' }
});
