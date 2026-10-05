import { isHttpError, type RequestEvent } from '@sveltejs/kit';
import { asc } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { profileSeed } from '$lib/server/db/seed-data';
import { profile, section, sectionItem } from '$lib/server/db/schema';
import { fakeEvent } from '$lib/server/testing/fakeEvent';
import { db, resetDb } from '$lib/server/testing/testDb';
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

/** A form POST from `as` (the admin by default) to the section `id`'s actions. */
const event = <E extends RequestEvent>(
	form: Record<string, string>,
	opts: { id?: number; as?: typeof admin } = {}
) =>
	fakeEvent<E>({
		url: 'http://localhost/admin/sections',
		locals: { user: opts.as ?? admin },
		params: { id: String(opts.id ?? 0) },
		form
	});

const newSection = {
	slug: 'talks',
	labelEn: 'Talks',
	labelSv: 'Föredrag',
	displayType: 'entries',
	visible: 'on',
	showInPdf: 'on'
};
const newItem = { titleEn: 'Svelte Summit', titleSv: 'Svelte Summit', startDate: '2026-05-01' };

let sectionId: number;
let itemId: number;
beforeEach(async () => {
	await resetDb();
	await db.insert(profile).values(profileSeed);
	[{ id: sectionId }] = await db
		.insert(section)
		.values({ slug: 'experience', labelEn: 'Experience', labelSv: 'Erfarenhet', sortOrder: 10 })
		.returning();
	[{ id: itemId }] = await db
		.insert(sectionItem)
		.values({ sectionId, titleEn: 'Spotify', titleSv: 'Spotify', sortOrder: 10 })
		.returning();
});

describe('section actions', () => {
	// Every action guards itself: they are POST endpoints, the page guard isn't enough.
	it.each([
		['create', () => listActions.create(event(newSection, { as: user('999') }))],
		['delete', () => listActions.delete(event({ id: String(sectionId) }, { as: user('999') }))],
		[
			'move',
			() => listActions.move(event({ id: String(sectionId), direction: 'up' }, { as: user('999') }))
		],
		['update', () => detailActions.update(event(newSection, { id: sectionId, as: user('999') }))],
		[
			'createItem',
			() => detailActions.createItem(event(newItem, { id: sectionId, as: user('999') }))
		],
		[
			'updateItem',
			() =>
				detailActions.updateItem(
					event({ ...newItem, id: String(itemId) }, { id: sectionId, as: user('999') })
				)
		],
		[
			'deleteItem',
			() =>
				detailActions.deleteItem(event({ id: String(itemId) }, { id: sectionId, as: user('999') }))
		],
		[
			'moveItem',
			() =>
				detailActions.moveItem(
					event({ id: String(itemId), direction: 'down' }, { id: sectionId, as: user('999') })
				)
		]
	])('%s is a 403 for anyone but the admin', async (_, run) => {
		await expect(run()).rejects.toSatisfy((e: unknown) => isHttpError(e, 403));
		expect(await db.select().from(section)).toHaveLength(1);
		expect((await db.select().from(sectionItem))[0].titleEn).toBe('Spotify');
	});

	it('creates a section, last', async () => {
		expect(await listActions.create(event(newSection))).toEqual({
			message: 'Section “Talks” created.'
		});
		const slugs = (await db.select().from(section).orderBy(asc(section.sortOrder))).map(
			(s) => s.slug
		);
		expect(slugs).toEqual(['experience', 'talks']);
	});

	it('turns a duplicate slug into a field error, keeping the input (#18)', async () => {
		const result = await listActions.create(event({ ...newSection, slug: 'experience' }));
		expect(result).toMatchObject({
			status: 400,
			data: {
				values: { slug: 'experience', labelEn: 'Talks' },
				errors: { slug: [expect.any(String)] }
			}
		});
	});

	it('reports a section that is gone', async () => {
		expect(await listActions.delete(event({ id: '999' }))).toMatchObject({ status: 404 });
	});
});

describe('section detail', () => {
	it('is a 404 for a missing section', async () => {
		const load = () => detailLoad(fakeEvent({ params: { id: '999' } }));
		await expect(load()).rejects.toSatisfy((e: unknown) => isHttpError(e, 404));
	});

	it('adds an item and reopens the right form on errors', async () => {
		expect(await detailActions.createItem(event(newItem, { id: sectionId }))).toEqual({
			message: 'Item added.'
		});
		const bad = await detailActions.updateItem(
			event({ ...newItem, id: String(itemId), link: 'javascript:alert(1)' }, { id: sectionId })
		);
		expect(bad).toMatchObject({
			status: 400,
			data: { target: String(itemId), errors: { link: [expect.any(String)] } }
		});
	});

	it('marks a failed section edit for the section form', async () => {
		const result = await detailActions.update(
			event({ ...newSection, slug: 'Bad Slug' }, { id: sectionId })
		);
		expect(result).toMatchObject({ status: 400, data: { target: 'section' } });
	});
});
