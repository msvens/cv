import { isHttpError } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { profileSeed } from '$lib/server/db/seed-data';
import { application, letter, profile } from '$lib/server/db/schema';
import { renderPdf } from '$lib/server/pdf/render';
import { fakeEvent } from '$lib/server/testing/fakeEvent';
import { db, resetDb } from '$lib/server/testing/testDb';
import { GET } from './+server';
import { text } from '$lib/server/pdf/__tests__/content';

vi.mock('$lib/server/db/client', () => import('$lib/server/testing/testDb'));
vi.mock('$app/env/private', () => ({ ADMIN_GITHUB_ID: '12345' }));
// The real renderer, watched: the bytes are compressed, so the language is checked on the
// document definition it was given.
vi.mock('$lib/server/pdf/render', async (original) => {
	const real = await original<typeof import('$lib/server/pdf/render')>();
	return { renderPdf: vi.fn(real.renderPdf) };
});

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

let id: number;
const get = (opts: { as?: typeof admin | null; app?: number } = {}) =>
	GET(
		fakeEvent<Parameters<typeof GET>[0]>({
			url: `http://localhost/admin/applications/${id}/letter.pdf`,
			// The visitor's language is Swedish; the letter is English and must win.
			cookies: { lang: 'sv' },
			locals: { user: opts.as === undefined ? admin : opts.as, lang: 'sv' },
			params: { id: String(opts.app ?? id) }
		})
	);

beforeEach(async () => {
	vi.mocked(renderPdf).mockClear();
	await resetDb();
	await db
		.insert(profile)
		.values({ ...profileSeed, titleEn: 'Engineering Director', titleSv: 'Teknikchef' });
	[{ id }] = await db
		.insert(application)
		.values({ company: 'Klarna Bank', role: 'Developer' })
		.returning();
	await db.insert(letter).values({
		applicationId: id,
		language: 'en',
		body: 'Dear team,',
		includeContact: true
	});
});

describe('GET letter.pdf', () => {
	it.each([
		['anonymous', null],
		['a signed-in stranger', user('999')]
	])('is a 403 for %s', async (_, as) => {
		await expect(get({ as })).rejects.toSatisfy((e: unknown) => isHttpError(e, 403));
		expect(renderPdf).not.toHaveBeenCalled();
	});

	it('renders the letter as a PDF that opens in the browser and is never cached', async () => {
		const res = await get();
		expect(res.headers.get('content-type')).toBe('application/pdf');
		expect(res.headers.get('content-disposition')).toBe(
			'inline; filename="martin-svensson-letter-klarna-bank.pdf"'
		);
		expect(res.headers.get('cache-control')).toBe('no-store');
		const bytes = Buffer.from(await res.arrayBuffer());
		expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
	});

	it("follows the letter's language, not the visitor's", async () => {
		await get();
		const doc = text(vi.mocked(renderPdf).mock.calls[0][0].content);
		expect(doc).toContain('Engineering Director');
		expect(doc).toContain('Stockholm, Sweden');
		expect(doc).not.toContain('Teknikchef');
	});

	it('is a 404 without a letter', async () => {
		await db.delete(letter);
		await expect(get()).rejects.toSatisfy((e: unknown) => isHttpError(e, 404));
	});
});
