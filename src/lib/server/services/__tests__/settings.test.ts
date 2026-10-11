import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { settings } from '$lib/server/db/schema';
import { db, resetDb } from '$lib/server/testing/testDb';
import { SETTINGS_DEFAULTS } from '$lib/settings';
import { getSettings, updateSettings } from '../settings';

vi.mock('$lib/server/db/client', () => import('$lib/server/testing/testDb'));

beforeEach(resetDb);

describe('settings service', () => {
	it('returns the defaults while nothing is saved', async () => {
		expect(await getSettings()).toEqual(SETTINGS_DEFAULTS);
	});

	it('creates the row on the first save and updates it after', async () => {
		await updateSettings({ attentionDays: 14 });
		expect(await getSettings()).toEqual({ attentionDays: 14 });
		await updateSettings({ attentionDays: 3 });
		expect(await getSettings()).toEqual({ attentionDays: 3 });
		expect(await db.select().from(settings)).toHaveLength(1);
	});

	it('has the same defaults in code and in the database', async () => {
		const [row] = await db.insert(settings).values({}).returning();
		expect({ attentionDays: row.attentionDays }).toEqual(SETTINGS_DEFAULTS);
	});

	it('refuses a second row', async () => {
		await expect(db.execute(sql`insert into settings (id) values (2)`)).rejects.toThrow();
	});
});
