/**
 * TEST-ONLY: an in-memory Postgres (PGlite) with the real migrations applied, standing in for
 * `$lib/server/db/client` so services can be tested against a real database without touching
 * the dev one. In a test file:
 *
 *   vi.mock('$lib/server/db/client', () => import('$lib/server/testing/testDb'));
 *
 * Vitest isolates modules per test file, so each file gets its own fresh database.
 */
import { PGlite } from '@electric-sql/pglite';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from '$lib/server/db/schema';

const client = new PGlite();

export const db = drizzle(client, { schema });

// The same folder scripts/migrate.ts applies; relative to the repo root, where tests run.
await migrate(db, { migrationsFolder: 'drizzle/migrations' });

/** Empty every table (ids restart at 1), for a clean slate between tests in one file. */
export async function resetDb(): Promise<void> {
	await db.execute(
		sql`TRUNCATE section_item, section, profile, profile_photo, application_status_change, application RESTART IDENTITY CASCADE`
	);
}
