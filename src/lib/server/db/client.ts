import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { DATABASE_URL } from '$app/env/private';
import * as schema from './schema';

const client = postgres(DATABASE_URL);

// adapter-node closes the HTTP server on SIGTERM/SIGINT, but open pool connections keep the
// event loop alive, so node would never exit (systemd SIGKILLs it after 90s). Close the pool
// once the server is done.
process.on('sveltekit:shutdown', () => client.end({ timeout: 5 }));

export const db = drizzle(client, { schema });
