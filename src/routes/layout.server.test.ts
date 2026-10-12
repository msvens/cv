import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ownerToday } from '$lib/dates';
import { profileSeed } from '$lib/server/db/seed-data';
import { application, profile, settings } from '$lib/server/db/schema';
import { fakeEvent } from '$lib/server/testing/fakeEvent';
import { db, resetDb } from '$lib/server/testing/testDb';
import { load as layoutLoad } from './+layout.server';
import { load as pageLoad } from './+page.server';

vi.mock('$lib/server/db/client', () => import('$lib/server/testing/testDb'));
vi.mock('$app/env/private', () => ({ ADMIN_GITHUB_ID: '12345' }));

const user = (githubId: string) => ({
	id: `u-${githubId}`,
	name: 'Me',
	email: 'me@example.com',
	emailVerified: true,
	image: null,
	createdAt: new Date(),
	updatedAt: new Date(),
	githubId,
	githubLogin: 'me'
});
const admin = user('12345');
const stranger = user('999');

type Visitor = typeof admin | null;
const layout = async (as: Visitor) => {
	const data = await layoutLoad(
		fakeEvent<Parameters<typeof layoutLoad>[0]>({ locals: { user: as, lang: 'en' } })
	);
	if (!data) throw new Error('the root layout always returns data');
	return data;
};

/** A date `n` days from today on the owner's calendar. */
const inDays = (n: number) => {
	const d = new Date(`${ownerToday()}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() + n);
	return d.toISOString().slice(0, 10);
};

beforeEach(async () => {
	await resetDb();
	await db.insert(profile).values(profileSeed);
	await db.insert(application).values([
		{ company: 'Acme Secret', role: 'Staff Engineer', deadline: inDays(-1) },
		{ company: 'Beta', role: 'Lead', deadline: inDays(10) },
		{ company: 'Gamma', role: 'CTO', deadline: inDays(1), status: 'applied' }
	]);
});

describe('root layout: attention (R5, R9)', () => {
	it('gives the admin what needs attention, within the saved window', async () => {
		const [acme] = await db
			.select()
			.from(application)
			.where(eq(application.company, 'Acme Secret'));
		expect((await layout(admin)).attention).toEqual({
			count: 1,
			only: { id: acme.id, company: 'Acme Secret', role: 'Staff Engineer' }
		});
		await db.insert(settings).values({ id: 1, attentionDays: 14 });
		// Two need attention: no single one to name.
		expect((await layout(admin)).attention).toEqual({ count: 2, only: null });
	});

	it.each([
		['anonymous', null],
		['a signed-in stranger', stranger]
	])('is null for %s', async (_, as) => {
		expect((await layout(as)).attention).toBeNull();
	});

	it('sends an anonymous visitor of / no application data at all', async () => {
		const layoutData = await layout(null);
		const page = await pageLoad(
			Object.assign(fakeEvent<Parameters<typeof pageLoad>[0]>(), {
				parent: async () => layoutData
			})
		);
		const sent = JSON.stringify({ ...layoutData, ...page });
		for (const word of ['Acme Secret', 'Staff Engineer', 'Beta', 'Gamma', 'CTO']) {
			expect(sent).not.toContain(word);
		}
		expect(layoutData.attention).toBeNull();
	});
});
