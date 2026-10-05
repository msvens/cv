import { readFileSync } from 'node:fs';
import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { db } from '$lib/server/testing/testDb';

// testDb applies drizzle/migrations to an empty database on import; these tests check the
// result, so a migration that fails or goes missing breaks the build, not a fresh install.
describe('migrations', () => {
	it('records every migration in the journal as applied', async () => {
		const journal = JSON.parse(readFileSync('drizzle/migrations/meta/_journal.json', 'utf8'));
		const applied = await db.execute<{ hash: string }>(
			sql`select hash from drizzle.__drizzle_migrations`
		);
		expect(applied.rows).toHaveLength(journal.entries.length);
	});

	it('creates the resume schema', async () => {
		const columns = await db.execute<{ table_name: string; column_name: string }>(
			sql`select table_name, column_name from information_schema.columns where table_schema = 'public'`
		);
		const tables = new Set(columns.rows.map((c) => c.table_name));
		expect([...tables].sort()).toEqual(['profile', 'profile_photo', 'section', 'section_item']);
		const sectionColumns = columns.rows
			.filter((c) => c.table_name === 'section')
			.map((c) => c.column_name);
		// Added by the later migrations (0001, 0002).
		expect(sectionColumns).toEqual(expect.arrayContaining(['show_in_pdf', 'visible']));
		const profileColumns = columns.rows
			.filter((c) => c.table_name === 'profile')
			.map((c) => c.column_name);
		// 0003: the link show/hide switches.
		expect(profileColumns).toEqual(expect.arrayContaining(['show_github', 'show_linkedin']));
	});

	it('stores the uploaded photo as binary (0004)', async () => {
		const type = await db.execute<{ data_type: string }>(
			sql`select data_type from information_schema.columns where table_name = 'profile_photo' and column_name = 'data'`
		);
		expect(type.rows[0].data_type).toBe('bytea');
	});
});
