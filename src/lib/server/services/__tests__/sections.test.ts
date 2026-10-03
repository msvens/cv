import { beforeEach, describe, expect, it, vi } from 'vitest';
import { section, sectionItem } from '$lib/server/db/schema';
import { db, resetDb } from '$lib/server/testing/testDb';
import {
	getSection,
	getSectionItem,
	listPdfSectionsWithItems,
	listSectionsWithItems,
	listVisibleSectionsWithItems
} from '../sections';

vi.mock('$lib/server/db/client', () => import('$lib/server/testing/testDb'));

async function addSection(
	slug: string,
	sortOrder: number,
	flags: { visible?: boolean; showInPdf?: boolean } = {}
) {
	const [row] = await db
		.insert(section)
		.values({ slug, labelEn: slug, labelSv: slug, sortOrder, ...flags })
		.returning();
	return row;
}

async function addItem(sectionId: number, title: string, sortOrder: number) {
	const [row] = await db
		.insert(sectionItem)
		.values({ sectionId, titleEn: title, titleSv: title, sortOrder })
		.returning();
	return row;
}

const slugs = (sections: { slug: string }[]) => sections.map((s) => s.slug);

beforeEach(resetDb);

describe('listSectionsWithItems', () => {
	it('returns nothing for an empty database', async () => {
		expect(await listSectionsWithItems()).toEqual([]);
	});

	it('orders sections by sortOrder, not insertion order', async () => {
		await addSection('skills', 20);
		await addSection('experience', 10);
		await addSection('education', 30);
		expect(slugs(await listSectionsWithItems())).toEqual(['experience', 'skills', 'education']);
	});

	it('puts each item under its own section, in sortOrder', async () => {
		const exp = await addSection('experience', 10);
		const edu = await addSection('education', 20);
		await addItem(edu.id, 'PhD', 10);
		await addItem(exp.id, 'Ericsson', 20);
		await addItem(exp.id, 'Spotify', 10);

		const [experience, education] = await listSectionsWithItems();
		expect(experience.items.map((i) => i.titleEn)).toEqual(['Spotify', 'Ericsson']);
		expect(education.items.map((i) => i.titleEn)).toEqual(['PhD']);
	});

	it('gives a section without items an empty list', async () => {
		await addSection('patents', 10);
		const [patents] = await listSectionsWithItems();
		expect(patents.items).toEqual([]);
	});
});

describe('visibility switches', () => {
	beforeEach(async () => {
		await addSection('both', 10);
		await addSection('site-only', 20, { showInPdf: false });
		await addSection('pdf-only', 30, { visible: false });
	});

	it('lists only visible sections on the site', async () => {
		expect(slugs(await listVisibleSectionsWithItems())).toEqual(['both', 'site-only']);
	});

	// The two switches are independent: a section hidden on the site can still be in the PDF.
	it('lists sections for the PDF by "show in PDF" alone', async () => {
		expect(slugs(await listPdfSectionsWithItems())).toEqual(['both', 'pdf-only']);
	});
});

describe('single lookups', () => {
	it('finds a section and an item by id', async () => {
		const exp = await addSection('experience', 10);
		const item = await addItem(exp.id, 'Spotify', 10);
		expect(await getSection(exp.id)).toMatchObject({ slug: 'experience' });
		expect(await getSectionItem(item.id)).toMatchObject({ titleEn: 'Spotify' });
	});

	it('returns null for a missing id', async () => {
		expect(await getSection(999)).toBeNull();
		expect(await getSectionItem(999)).toBeNull();
	});
});
