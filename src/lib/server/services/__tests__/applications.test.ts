import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { profileSeed } from '$lib/server/db/seed-data';
import { application, applicationStatusChange, profile } from '$lib/server/db/schema';
import { db, resetDb } from '$lib/server/testing/testDb';
import type { ApplicationInput } from '$lib/validation/schemas';
import {
	changeStatus,
	createApplication,
	deleteApplication,
	getApplication,
	listStatusChanges,
	updateApplication
} from '../applications';

vi.mock('$lib/server/db/client', () => import('$lib/server/testing/testDb'));

const details: ApplicationInput = {
	company: 'Spotify',
	role: 'Backend engineer',
	adUrl: '',
	location: 'Stockholm',
	deadline: '2026-10-20',
	appliedOn: '',
	notes: '',
	adText: ''
};
const statuses = async (id: number) => (await listStatusChanges(id)).map((c) => c.status);

const PROFILE_UPDATED = new Date('2026-01-01T00:00:00Z');
beforeEach(async () => {
	await resetDb();
	await db.insert(profile).values({ ...profileSeed, updatedAt: PROFILE_UPDATED });
});

describe('applications service', () => {
	it('creates an application, Not applied, with the first timeline entry', async () => {
		const id = await createApplication({ company: 'Spotify', role: 'Backend engineer' });
		expect(await getApplication(id)).toMatchObject({ status: 'not_applied', deadline: null });
		expect(await statuses(id)).toEqual(['not_applied']);
	});

	it('saves the details, blank fields as NULL', async () => {
		const id = await createApplication({ company: 'X', role: 'Y' });
		expect(await updateApplication(id, details)).toBe('ok');
		expect(await getApplication(id)).toMatchObject({
			company: 'Spotify',
			location: 'Stockholm',
			deadline: '2026-10-20',
			adUrl: null,
			appliedOn: null,
			notes: null
		});
	});

	it('records each status change on the timeline, and nothing for the same status', async () => {
		const id = await createApplication({ company: 'X', role: 'Y' });
		await changeStatus(id, 'applied', '2026-10-06');
		await changeStatus(id, 'applied', '2026-10-07');
		await changeStatus(id, 'interviewing', '2026-10-08');
		expect(await statuses(id)).toEqual(['not_applied', 'applied', 'interviewing']);
		expect((await getApplication(id))?.status).toBe('interviewing');
	});

	it('fills the applied date on Applied, but keeps one already set', async () => {
		const first = await createApplication({ company: 'A', role: 'R' });
		await changeStatus(first, 'applied', '2026-10-06');
		expect((await getApplication(first))?.appliedOn).toBe('2026-10-06');

		const second = await createApplication({ company: 'B', role: 'R' });
		await updateApplication(second, { ...details, appliedOn: '2026-09-30' });
		await changeStatus(second, 'applied', '2026-10-06');
		expect((await getApplication(second))?.appliedOn).toBe('2026-09-30');
	});

	it('deletes the application and its timeline', async () => {
		const id = await createApplication({ company: 'X', role: 'Y' });
		await changeStatus(id, 'applied', '2026-10-06');
		expect(await deleteApplication(id)).toBe('ok');
		expect(await db.select().from(application)).toHaveLength(0);
		expect(await db.select().from(applicationStatusChange)).toHaveLength(0);
	});

	it('reports a missing application', async () => {
		expect(await updateApplication(999, details)).toBe('not-found');
		expect(await changeStatus(999, 'applied', '2026-10-06')).toBe('not-found');
		expect(await deleteApplication(999)).toBe('not-found');
	});

	it("never moves the public profile's Updated date", async () => {
		const id = await createApplication({ company: 'X', role: 'Y' });
		await updateApplication(id, details);
		await changeStatus(id, 'applied', '2026-10-06');
		await deleteApplication(id);
		const [row] = await db.select().from(profile).where(eq(profile.id, 1));
		expect(row.updatedAt).toEqual(PROFILE_UPDATED);
	});
});
