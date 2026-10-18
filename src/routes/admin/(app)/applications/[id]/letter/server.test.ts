import { isHttpError, isRedirect, type RequestEvent } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { application, applicationContact, letter } from '$lib/server/db/schema';
import { fakeEvent } from '$lib/server/testing/fakeEvent';
import { db, resetDb } from '$lib/server/testing/testDb';
import { actions, load } from './+page.server';

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

let id: number;
let other: number;
const event = <E extends RequestEvent>(
	form: Record<string, string>,
	opts: { as?: typeof admin; app?: number } = {}
) =>
	fakeEvent<E>({
		url: 'http://localhost/admin/applications',
		locals: { user: opts.as ?? admin },
		params: { id: String(opts.app ?? id) },
		form
	});

const save = { language: 'en', body: 'Dear team,', includeContact: 'on' };

beforeEach(async () => {
	await resetDb();
	[{ id }, { id: other }] = await db
		.insert(application)
		.values([
			{ company: 'Klarna', role: 'Developer' },
			{ company: 'Spotify', role: 'Lead' }
		])
		.returning();
	await db.insert(letter).values({ applicationId: other, language: 'sv', body: 'Hej!' });
});

describe('letter actions', () => {
	it.each([
		['save', () => actions.save(event(save, { as: stranger }))],
		['copy', () => actions.copy(event({ from: String(other) }, { as: stranger }))],
		['delete', () => actions.delete(event({}, { as: stranger, app: other }))]
	])('%s is a 403 for anyone but the admin', async (_, run) => {
		await expect(run()).rejects.toSatisfy((e: unknown) => isHttpError(e, 403));
		expect(await db.select().from(letter)).toMatchObject([{ applicationId: other, body: 'Hej!' }]);
	});

	it('saves the letter and its options', async () => {
		expect(await actions.save(event(save))).toEqual({ message: 'Letter saved.' });
		const { letter: saved } = (await load(fakeEvent({ params: { id: String(id) } }))) as {
			letter: unknown;
		};
		expect(saved).toMatchObject({
			language: 'en',
			body: 'Dear team,',
			includeContact: true,
			includeRecipient: false,
			recipientContactId: null
		});
	});

	it('keeps the input when the language is bad', async () => {
		const result = await actions.save(event({ ...save, language: 'de' }));
		expect(result).toMatchObject({
			status: 400,
			data: {
				values: { language: 'de', body: 'Dear team,' },
				errors: { language: expect.any(Array) }
			}
		});
	});

	it("refuses another application's contact", async () => {
		const [{ id: bo }] = await db
			.insert(applicationContact)
			.values({ applicationId: other, name: 'Bo' })
			.returning();
		const result = await actions.save(
			event({ ...save, includeRecipient: 'on', recipientContactId: String(bo) })
		);
		expect(result).toMatchObject({ status: 404 });
	});

	it('copies an earlier letter once', async () => {
		expect(await actions.copy(event({ from: String(other) }))).toEqual({
			message: 'Letter copied.'
		});
		expect(await actions.copy(event({ from: String(other) }))).toMatchObject({ status: 409 });
		expect(await actions.copy(event({ from: 'x' }, { app: other }))).toMatchObject({
			status: 404
		});
	});

	it('deletes the letter and goes back to the application', async () => {
		try {
			await actions.delete(event({}, { app: other }));
			expect.unreachable();
		} catch (e) {
			expect(isRedirect(e) && e.location).toBe(`/admin/applications/${other}`);
		}
		expect(await db.select().from(letter)).toEqual([]);
		expect(await actions.delete(event({}, { app: other }))).toMatchObject({ status: 404 });
	});
});

describe('letter page', () => {
	it('offers earlier letters only while there is none', async () => {
		const page = (app: number) => load(fakeEvent({ params: { id: String(app) } }));
		expect(await page(id)).toMatchObject({
			letter: null,
			sources: [{ applicationId: other, company: 'Spotify' }]
		});
		expect(await page(other)).toMatchObject({ sources: [] });
	});

	it('is a 404 for a missing application', async () => {
		await expect(load(fakeEvent({ params: { id: '9999' } }))).rejects.toSatisfy((e: unknown) =>
			isHttpError(e, 404)
		);
	});
});
