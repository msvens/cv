import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { profileSeed } from '$lib/server/db/seed-data';
import {
	application,
	applicationContact,
	applicationStatusChange,
	profile
} from '$lib/server/db/schema';
import { db, resetDb } from '$lib/server/testing/testDb';
import type { ApplicationInput, ContactInput } from '$lib/validation/schemas';
import {
	addContact,
	changeStatus,
	createApplication,
	deleteApplication,
	deleteContact,
	getApplication,
	listContacts,
	listStatusChanges,
	updateApplication,
	updateContact
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
const anna: ContactInput = {
	name: 'Anna Berg',
	role: 'Recruiter',
	email: 'anna@example.com',
	phone: '',
	note: ''
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
		await addContact(id, anna);
		const [{ id: contactId }] = await listContacts(id);
		await updateContact(id, contactId, anna);
		await deleteContact(id, contactId);
		await deleteApplication(id);
		const [row] = await db.select().from(profile).where(eq(profile.id, 1));
		expect(row.updatedAt).toEqual(PROFILE_UPDATED);
	});
});

describe('contacts', () => {
	let id: number;
	let otherId: number;
	beforeEach(async () => {
		id = await createApplication({ company: 'Spotify', role: 'Backend engineer' });
		otherId = await createApplication({ company: 'Klarna', role: 'Developer' });
	});
	const names = async (appId: number) => (await listContacts(appId)).map((c) => c.name);
	const updatedAt = async (appId: number) => (await getApplication(appId))!.updatedAt;

	it('adds contacts in order, blank fields as NULL', async () => {
		expect(await addContact(id, anna)).toBe('ok');
		expect(await addContact(id, { ...anna, name: 'Bo Ek', email: '' })).toBe('ok');
		expect(await names(id)).toEqual(['Anna Berg', 'Bo Ek']);
		expect((await listContacts(id))[1]).toMatchObject({ email: null, phone: null, note: null });
		expect(await listContacts(otherId)).toEqual([]);
	});

	it('edits and deletes a contact', async () => {
		await addContact(id, anna);
		const [{ id: contactId }] = await listContacts(id);
		expect(await updateContact(id, contactId, { ...anna, role: 'Hiring manager' })).toBe('ok');
		expect((await listContacts(id))[0].role).toBe('Hiring manager');
		expect(await deleteContact(id, contactId)).toBe('ok');
		expect(await listContacts(id)).toEqual([]);
	});

	it("never reaches another application's contact", async () => {
		await addContact(otherId, anna);
		const [{ id: theirs }] = await listContacts(otherId);
		expect(await updateContact(id, theirs, { ...anna, name: 'Changed' })).toBe('not-found');
		expect(await deleteContact(id, theirs)).toBe('not-found');
		expect(await names(otherId)).toEqual(['Anna Berg']);
	});

	it('reports a missing application or contact', async () => {
		expect(await addContact(999, anna)).toBe('not-found');
		expect(await updateContact(id, 999, anna)).toBe('not-found');
		expect(await deleteContact(id, 999)).toBe('not-found');
		expect(await db.select().from(applicationContact)).toEqual([]);
	});

	it('counts working on contacts as activity on the application', async () => {
		const old = new Date('2026-01-01T00:00:00Z');
		const reset = () =>
			db.update(application).set({ updatedAt: old }).where(eq(application.id, id));
		await reset();
		await addContact(id, anna);
		expect(await updatedAt(id)).not.toEqual(old);
		const [{ id: contactId }] = await listContacts(id);
		await reset();
		await updateContact(id, contactId, anna);
		expect(await updatedAt(id)).not.toEqual(old);
		await reset();
		await deleteContact(id, contactId);
		expect(await updatedAt(id)).not.toEqual(old);
	});

	it('goes with its application', async () => {
		await addContact(id, anna);
		await deleteApplication(id);
		expect(await db.select().from(applicationContact)).toEqual([]);
	});
});
