import { isHttpError, isRedirect, type RequestEvent } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { application, applicationStatusChange } from '$lib/server/db/schema';
import { fakeEvent } from '$lib/server/testing/fakeEvent';
import { db, resetDb } from '$lib/server/testing/testDb';
import { load as adminLoad } from '../../+page.server';
import { actions as listActions } from './+page.server';
import { actions as detailActions, load as detailLoad } from './[id]/+page.server';

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

/** A form POST from `as` (the admin by default) to the application `id`'s actions. */
const event = <E extends RequestEvent>(
	form: Record<string, string>,
	opts: { id?: number; as?: typeof admin } = {}
) =>
	fakeEvent<E>({
		url: 'http://localhost/admin/applications',
		locals: { user: opts.as ?? admin },
		params: { id: String(opts.id ?? 0) },
		form
	});

const details = {
	company: 'Spotify',
	role: 'Backend engineer',
	adUrl: 'https://jobs.example.com/1',
	location: '',
	deadline: '2026-10-20',
	appliedOn: '',
	notes: '',
	adText: ''
};

/** The redirect an action or load throws, as its status and location. */
async function redirectOf(run: () => unknown) {
	try {
		await run();
	} catch (e) {
		if (isRedirect(e)) return { status: e.status, location: e.location };
		throw e;
	}
	throw new Error('expected a redirect');
}

let id: number;
beforeEach(async () => {
	await resetDb();
	[{ id }] = await db
		.insert(application)
		.values({ company: 'Klarna', role: 'Developer' })
		.returning();
	await db.insert(applicationStatusChange).values({ applicationId: id, status: 'not_applied' });
});

describe('application actions', () => {
	// Every action guards itself: they are POST endpoints, the page guard isn't enough.
	it.each([
		['create', () => listActions.create(event({ company: 'A', role: 'B' }, { as: stranger }))],
		['update', () => detailActions.update(event(details, { id, as: stranger }))],
		[
			'changeStatus',
			() => detailActions.changeStatus(event({ status: 'applied' }, { id, as: stranger }))
		],
		['delete', () => detailActions.delete(event({}, { id, as: stranger }))]
	])('%s is a 403 for anyone but the admin', async (_, run) => {
		await expect(run()).rejects.toSatisfy((e: unknown) => isHttpError(e, 403));
		const rows = await db.select().from(application);
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({ company: 'Klarna', status: 'not_applied' });
	});

	it('creates an application and opens it', async () => {
		const target = await redirectOf(() =>
			listActions.create(event({ company: 'Spotify', role: 'Backend engineer' }))
		);
		const created = (await db.select().from(application)).find((a) => a.company === 'Spotify');
		expect(target).toEqual({ status: 303, location: `/admin/applications/${created?.id}` });
	});

	it('keeps the input when create fails', async () => {
		expect(await listActions.create(event({ company: 'Spotify', role: '' }))).toMatchObject({
			status: 400,
			data: { values: { company: 'Spotify', role: '' }, errors: { role: [expect.any(String)] } }
		});
	});

	it('saves the details', async () => {
		expect(await detailActions.update(event(details, { id }))).toEqual({
			message: 'Application saved.'
		});
		expect((await db.select().from(application))[0]).toMatchObject({
			company: 'Spotify',
			deadline: '2026-10-20'
		});
	});

	it('rejects a bad ad link and a bad date as field errors, saving nothing', async () => {
		const result = await detailActions.update(
			event({ ...details, adUrl: 'javascript:alert(1)', deadline: '20 Oct' }, { id })
		);
		expect(result).toMatchObject({
			status: 400,
			data: { errors: { adUrl: [expect.any(String)], deadline: [expect.any(String)] } }
		});
		expect((await db.select().from(application))[0].company).toBe('Klarna');
	});

	it('changes the status onto the timeline', async () => {
		expect(await detailActions.changeStatus(event({ status: 'applied' }, { id }))).toEqual({
			message: 'Status changed.'
		});
		const changes = await db.select().from(applicationStatusChange);
		expect(changes.map((c) => c.status)).toEqual(['not_applied', 'applied']);
		expect((await db.select().from(application))[0].appliedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	it('refuses an unknown status', async () => {
		expect(await detailActions.changeStatus(event({ status: 'ghosted' }, { id }))).toMatchObject({
			status: 400
		});
		expect(await db.select().from(applicationStatusChange)).toHaveLength(1);
	});

	it('deletes and goes back to the list', async () => {
		expect(await redirectOf(() => detailActions.delete(event({}, { id })))).toEqual({
			status: 303,
			location: '/admin/applications'
		});
		expect(await db.select().from(application)).toHaveLength(0);
	});

	it('reports an application that is gone', async () => {
		expect(await detailActions.update(event(details, { id: 999 }))).toMatchObject({ status: 404 });
	});
});

describe('application pages', () => {
	it('is a 404 for a missing or malformed id', async () => {
		for (const param of ['999', 'abc']) {
			const load = () => detailLoad(fakeEvent({ params: { id: param } }));
			await expect(load()).rejects.toSatisfy((e: unknown) => isHttpError(e, 404));
		}
	});

	it('loads the application with its timeline', async () => {
		const data = await detailLoad(fakeEvent({ params: { id: String(id) } }));
		expect(data).toMatchObject({
			application: { company: 'Klarna' },
			timeline: [{ status: 'not_applied' }]
		});
	});

	it('opens the admin on the applications', async () => {
		expect(await redirectOf(async () => adminLoad(fakeEvent()))).toEqual({
			status: 303,
			location: '/admin/applications'
		});
	});
});
