import { isHttpError } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { application, applicationSnapshot } from '$lib/server/db/schema';
import { fakeEvent } from '$lib/server/testing/fakeEvent';
import { db, resetDb } from '$lib/server/testing/testDb';
import { GET } from './+server';

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

let klarna: number;
let spotify: number;
let sid: number;
const get = (opts: { as?: typeof admin | null; app?: number; snapshot?: string } = {}) =>
	GET(
		fakeEvent<Parameters<typeof GET>[0]>({
			url: `http://localhost/admin/applications/${klarna}/snapshots/${sid}`,
			locals: { user: opts.as === undefined ? admin : opts.as },
			params: { id: String(opts.app ?? klarna), sid: opts.snapshot ?? String(sid) }
		})
	);

beforeEach(async () => {
	await resetDb();
	[{ id: klarna }, { id: spotify }] = await db
		.insert(application)
		.values([
			{ company: 'Klarna', role: 'Developer' },
			{ company: 'Spotify', role: 'Developer' }
		])
		.returning();
	[{ id: sid }] = await db
		.insert(applicationSnapshot)
		.values({
			applicationId: klarna,
			kind: 'letter',
			language: 'sv',
			filename: 'old-name-letter-klarna.pdf',
			data: new Uint8Array(Buffer.from('%PDF-frozen'))
		})
		.returning();
});

describe('GET snapshot', () => {
	it.each([
		['anonymous', null],
		['a signed-in stranger', user('999')]
	])('is a 403 for %s', async (_, as) => {
		await expect(get({ as })).rejects.toSatisfy((e: unknown) => isHttpError(e, 403));
	});

	it('serves the stored bytes under the stored name, never cached', async () => {
		const res = await get();
		expect(res.headers.get('content-type')).toBe('application/pdf');
		expect(res.headers.get('content-disposition')).toBe(
			'inline; filename="old-name-letter-klarna.pdf"'
		);
		expect(res.headers.get('cache-control')).toBe('no-store');
		expect(Buffer.from(await res.arrayBuffer()).toString()).toBe('%PDF-frozen');
	});

	it('is a 404 through another application, or for an unknown or malformed id', async () => {
		for (const opts of [{ app: spotify }, { snapshot: '999' }, { snapshot: 'abc' }]) {
			await expect(get(opts)).rejects.toSatisfy((e: unknown) => isHttpError(e, 404));
		}
	});
});
