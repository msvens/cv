import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { building } from '$app/environment';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

// `vite build` imports server modules to analyse them, with no runtime env. postgres.js
// connects lazily, so the build never touches the database and needs no URL.
if (!building && !env.DATABASE_URL) {
	throw new Error('DATABASE_URL environment variable is required');
}

const client = postgres(env.DATABASE_URL);

export const db = drizzle(client, { schema });
