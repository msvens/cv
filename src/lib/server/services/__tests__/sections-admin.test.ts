import { asc, eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { profileSeed } from '$lib/server/db/seed-data';
import { profile, section, sectionItem } from '$lib/server/db/schema';
import { db, resetDb } from '$lib/server/testing/testDb';
import type { SectionInput, SectionItemInput } from '$lib/validation/schemas';
import {
	createItem,
	createSection,
	deleteItem,
	deleteSection,
	listSectionsWithCounts,
	moveItem,
	moveSection,
	updateItem,
	updateSection
} from '../sections';

vi.mock('$lib/server/db/client', () => import('$lib/server/testing/testDb'));

const sectionInput = (slug: string): SectionInput => ({
	slug,
	labelEn: slug,
	labelSv: slug,
	displayType: 'entries',
	visible: true,
	showInPdf: true
});

const itemInput = (title: string): SectionItemInput => ({
	titleEn: title,
	titleSv: title,
	subtitleEn: '',
	subtitleSv: '',
	startDate: '',
	endDate: '',
	link: '',
	descriptionEn: '',
	descriptionSv: ''
});

const sections = () => db.select().from(section).orderBy(asc(section.sortOrder));
const items = (sectionId: number) =>
	db
		.select()
		.from(sectionItem)
		.where(eq(sectionItem.sectionId, sectionId))
		.orderBy(asc(sectionItem.sortOrder));
const slugs = async () => (await sections()).map((s) => s.slug);
const titles = async (sectionId: number) => (await items(sectionId)).map((i) => i.titleEn);
const idOf = async (slug: string) => (await sections()).find((s) => s.slug === slug)!.id;

const OLD = new Date('2026-01-01T00:00:00Z');
const updatedAt = async () => (await db.select().from(profile))[0].updatedAt;

beforeEach(async () => {
	await resetDb();
	await db.insert(profile).values({ ...profileSeed, updatedAt: OLD });
});

describe('sections', () => {
	it('puts the first section at 10 and each new one last', async () => {
		expect(await createSection(sectionInput('a'))).toBe('ok');
		await createSection(sectionInput('b'));
		expect((await sections()).map((s) => [s.slug, s.sortOrder])).toEqual([
			['a', 10],
			['b', 20]
		]);
	});

	it('refuses a slug that another section has (#18)', async () => {
		await createSection(sectionInput('a'));
		await createSection(sectionInput('b'));
		expect(await createSection(sectionInput('a'))).toBe('slug-taken');
		expect(await updateSection(await idOf('b'), sectionInput('a'))).toBe('slug-taken');
		expect(await slugs()).toEqual(['a', 'b']);
	});

	it('lets a section keep its own slug when edited', async () => {
		await createSection(sectionInput('a'));
		expect(await updateSection(await idOf('a'), { ...sectionInput('a'), labelEn: 'A' })).toBe('ok');
		expect((await sections())[0].labelEn).toBe('A');
	});

	it('reports a missing section', async () => {
		expect(await updateSection(999, sectionInput('x'))).toBe('not-found');
		expect(await deleteSection(999)).toBe('not-found');
	});

	it('deletes a section together with its items', async () => {
		await createSection(sectionInput('a'));
		const id = await idOf('a');
		await createItem(id, itemInput('one'));
		expect(await deleteSection(id)).toBe('ok');
		expect(await db.select().from(sectionItem)).toEqual([]);
	});

	it('counts each section’s items', async () => {
		await createSection(sectionInput('a'));
		await createSection(sectionInput('b'));
		await createItem(await idOf('a'), itemInput('one'));
		await createItem(await idOf('a'), itemInput('two'));
		expect((await listSectionsWithCounts()).map((s) => [s.slug, s.itemCount])).toEqual([
			['a', 2],
			['b', 0]
		]);
	});
});

describe('moving sections', () => {
	beforeEach(async () => {
		for (const slug of ['a', 'b', 'c']) await createSection(sectionInput(slug));
	});

	it('moves up and down', async () => {
		expect(await moveSection(await idOf('c'), 'up')).toBe('ok');
		expect(await slugs()).toEqual(['a', 'c', 'b']);
		await moveSection(await idOf('a'), 'down');
		expect(await slugs()).toEqual(['c', 'a', 'b']);
	});

	it('does nothing past the ends', async () => {
		await moveSection(await idOf('a'), 'up');
		await moveSection(await idOf('c'), 'down');
		expect(await slugs()).toEqual(['a', 'b', 'c']);
	});

	// The old app swapped two sortOrder values, which silently did nothing for equal values.
	it('still moves when old rows share a sortOrder, and repairs the numbering', async () => {
		await db.update(section).set({ sortOrder: 10 });
		const before = await slugs(); // tie broken by id: a, b, c
		await moveSection(await idOf(before[2]), 'up');
		expect(await slugs()).toEqual([before[0], before[2], before[1]]);
		expect((await sections()).map((s) => s.sortOrder)).toEqual([10, 20, 30]);
	});
});

describe('items', () => {
	let a: number;
	let b: number;
	beforeEach(async () => {
		await createSection(sectionInput('a'));
		await createSection(sectionInput('b'));
		a = await idOf('a');
		b = await idOf('b');
	});

	it('adds items last within their own section', async () => {
		await createItem(a, itemInput('one'));
		await createItem(b, itemInput('other'));
		await createItem(a, itemInput('two'));
		expect((await items(a)).map((i) => [i.titleEn, i.sortOrder])).toEqual([
			['one', 10],
			['two', 20]
		]);
		expect(await titles(b)).toEqual(['other']);
	});

	it('stores blank optional fields as null', async () => {
		await createItem(a, { ...itemInput('one'), startDate: '2020-01-01', link: '' });
		expect((await items(a))[0]).toMatchObject({
			startDate: '2020-01-01',
			link: null,
			subtitleEn: null
		});
	});

	it('refuses an item for a missing section', async () => {
		expect(await createItem(999, itemInput('x'))).toBe('not-found');
	});

	it('edits, moves and deletes only within the section in the URL', async () => {
		await createItem(b, itemInput('other'));
		const otherId = (await items(b))[0].id;
		expect(await updateItem(a, otherId, itemInput('hijacked'))).toBe('not-found');
		expect(await moveItem(a, otherId, 'up')).toBe('not-found');
		expect(await deleteItem(a, otherId)).toBe('not-found');
		expect(await titles(b)).toEqual(['other']);
	});

	it('updates, moves and deletes an item', async () => {
		for (const t of ['one', 'two', 'three']) await createItem(a, itemInput(t));
		const [one, , three] = await items(a);
		expect(await updateItem(a, one.id, itemInput('ONE'))).toBe('ok');
		expect(await moveItem(a, three.id, 'up')).toBe('ok');
		expect(await titles(a)).toEqual(['ONE', 'three', 'two']);
		expect(await deleteItem(a, one.id)).toBe('ok');
		expect(await titles(a)).toEqual(['three', 'two']);
	});
});

describe('the footer’s "Updated"', () => {
	it.each([
		['create a section', async () => createSection(sectionInput('new'))],
		['edit a section', async (id: number) => updateSection(id, sectionInput('edited'))],
		['delete a section', async (id: number) => deleteSection(id)],
		['move a section', async (id: number) => moveSection(id, 'down')],
		['add an item', async (id: number) => createItem(id, itemInput('new'))]
	])('moves when you %s', async (_, write) => {
		await db.insert(section).values([
			{ slug: 'x', labelEn: 'x', labelSv: 'x', sortOrder: 10 },
			{ slug: 'y', labelEn: 'y', labelSv: 'y', sortOrder: 20 }
		]);
		const id = (await sections())[0].id;
		expect(await write(id)).toBe('ok');
		expect((await updatedAt()).getTime()).toBeGreaterThan(OLD.getTime());
	});

	it.each([
		['edit an item', (s: number, i: number) => updateItem(s, i, itemInput('edited'))],
		['move an item', (s: number, i: number) => moveItem(s, i, 'down')],
		['delete an item', (s: number, i: number) => deleteItem(s, i)]
	])('moves when you %s', async (_, write) => {
		const [{ id: s }] = await db
			.insert(section)
			.values({ slug: 'x', labelEn: 'x', labelSv: 'x', sortOrder: 10 })
			.returning();
		const [{ id: i }] = await db
			.insert(sectionItem)
			.values([
				{ sectionId: s, titleEn: '1', titleSv: '1', sortOrder: 10 },
				{ sectionId: s, titleEn: '2', titleSv: '2', sortOrder: 20 }
			])
			.returning();
		expect(await write(s, i)).toBe('ok');
		expect((await updatedAt()).getTime()).toBeGreaterThan(OLD.getTime());
	});

	it('stays put when nothing changed (a move past the end, a duplicate slug)', async () => {
		await db.insert(section).values({ slug: 'x', labelEn: 'x', labelSv: 'x', sortOrder: 10 });
		const id = (await sections())[0].id;
		await moveSection(id, 'up');
		await createSection(sectionInput('x'));
		expect(await updatedAt()).toEqual(OLD);
	});
});
