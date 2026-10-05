import { and, asc, count, eq, inArray, max, ne, type SQL } from 'drizzle-orm';
import { db } from '$lib/server/db/client';
import { profile, section, sectionItem } from '$lib/server/db/schema';
import { nullIfBlank } from '$lib/server/forms';
import type { SectionData, SectionItemData, SectionWithItems } from '$lib/types';
import type { SectionInput, SectionItemInput } from '$lib/validation/schemas';

export async function listSections() {
	return db.select().from(section).orderBy(asc(section.sortOrder));
}

export async function getSection(id: number): Promise<SectionData | null> {
	const rows = await db.select().from(section).where(eq(section.id, id));
	return rows[0] ?? null;
}

export async function listItemsBySection(sectionId: number) {
	return db
		.select()
		.from(sectionItem)
		.where(eq(sectionItem.sectionId, sectionId))
		.orderBy(asc(sectionItem.sortOrder));
}

export async function getSectionItem(id: number): Promise<SectionItemData | null> {
	const rows = await db.select().from(sectionItem).where(eq(sectionItem.id, id));
	return rows[0] ?? null;
}

/** Sections matching `where` (all if omitted), each with its items — two queries, not N+1. */
async function sectionsWithItems(where?: SQL): Promise<SectionWithItems[]> {
	const sections = await db.select().from(section).where(where).orderBy(asc(section.sortOrder));
	if (sections.length === 0) return [];

	const items = await db
		.select()
		.from(sectionItem)
		.where(
			inArray(
				sectionItem.sectionId,
				sections.map((s) => s.id)
			)
		)
		.orderBy(asc(sectionItem.sortOrder));

	const bySection = new Map<number, SectionItemData[]>();
	for (const item of items) {
		const list = bySection.get(item.sectionId);
		if (list) list.push(item);
		else bySection.set(item.sectionId, [item]);
	}
	return sections.map((s) => ({ ...s, items: bySection.get(s.id) ?? [] }));
}

export function listSectionsWithItems() {
	return sectionsWithItems();
}

export function listVisibleSectionsWithItems() {
	return sectionsWithItems(eq(section.visible, true));
}

export function listPdfSectionsWithItems() {
	// Only the "show in PDF" switch counts, independent of "visible": a section can be
	// site-only or PDF-only.
	return sectionsWithItems(eq(section.showInPdf, true));
}

// --- Admin: listing -----------------------------------------------------------------------

export type SectionWithCount = SectionData & { itemCount: number };

/** All sections in order, each with its number of items (for the list and its delete confirm). */
export async function listSectionsWithCounts(): Promise<SectionWithCount[]> {
	const counts = await db
		.select({ sectionId: sectionItem.sectionId, n: count() })
		.from(sectionItem)
		.groupBy(sectionItem.sectionId);
	const bySection = new Map(counts.map((c) => [c.sectionId, c.n]));
	const sections = await listSections();
	return sections.map((s) => ({ ...s, itemCount: bySection.get(s.id) ?? 0 }));
}

// --- Admin: writes ------------------------------------------------------------------------
//
// Every write runs in one transaction that also moves profile.updatedAt, so the footer's
// "Updated" means the resume changed (sections and items have no timestamps of their own).

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type Direction = 'up' | 'down';
export type WriteResult = 'ok' | 'not-found' | 'slug-taken';

async function touchProfile(tx: Tx): Promise<void> {
	await tx.update(profile).set({ updatedAt: new Date() });
}

/** Postgres unique violation, as Drizzle surfaces it (the code is on the wrapped cause). */
function isUniqueViolation(error: unknown): boolean {
	const cause: unknown = error instanceof Error ? error.cause : undefined;
	return !!cause && typeof cause === 'object' && Reflect.get(cause, 'code') === '23505';
}

async function slugTaken(tx: Tx, slug: string, exceptId?: number): Promise<boolean> {
	const rows = await tx
		.select({ id: section.id })
		.from(section)
		.where(
			exceptId ? and(eq(section.slug, slug), ne(section.id, exceptId)) : eq(section.slug, slug)
		);
	return rows.length > 0;
}

/**
 * Checked up front for a friendly form error; the unique constraint still has the last word
 * if two saves race, and that becomes the same result instead of a 500 (#18).
 */
async function guardSlug(write: () => Promise<WriteResult>): Promise<WriteResult> {
	try {
		return await write();
	} catch (error) {
		if (isUniqueViolation(error)) return 'slug-taken';
		throw error;
	}
}

export function createSection(input: SectionInput): Promise<WriteResult> {
	return guardSlug(() =>
		db.transaction(async (tx) => {
			if (await slugTaken(tx, input.slug)) return 'slug-taken';
			const [{ last }] = await tx.select({ last: max(section.sortOrder) }).from(section);
			await tx.insert(section).values({ ...input, sortOrder: (last ?? 0) + 10 });
			await touchProfile(tx);
			return 'ok';
		})
	);
}

export function updateSection(id: number, input: SectionInput): Promise<WriteResult> {
	return guardSlug(() =>
		db.transaction(async (tx) => {
			if (await slugTaken(tx, input.slug, id)) return 'slug-taken';
			const updated = await tx
				.update(section)
				.set(input)
				.where(eq(section.id, id))
				.returning({ id: section.id });
			if (updated.length === 0) return 'not-found';
			await touchProfile(tx);
			return 'ok';
		})
	);
}

/** Deletes the section; the database cascades its items. */
export function deleteSection(id: number): Promise<WriteResult> {
	return db.transaction(async (tx) => {
		const deleted = await tx
			.delete(section)
			.where(eq(section.id, id))
			.returning({ id: section.id });
		if (deleted.length === 0) return 'not-found';
		await touchProfile(tx);
		return 'ok';
	});
}

/**
 * The ordered ids with `id` moved one step, or null when it can't move (missing, or already
 * first/last).
 */
function moved(ids: number[], id: number, direction: Direction): number[] | null {
	const from = ids.indexOf(id);
	const to = direction === 'up' ? from - 1 : from + 1;
	if (from === -1 || to < 0 || to >= ids.length) return null;
	const next = [...ids];
	[next[from], next[to]] = [next[to], next[from]];
	return next;
}

/**
 * Move a row and renumber the whole list 10, 20, … in one transaction. Renumbering (instead
 * of swapping two sortOrder values, as the old app did) also works when old rows share a
 * sortOrder — a swap of equal values silently changes nothing.
 */
async function reorder(
	tx: Tx,
	table: typeof section | typeof sectionItem,
	ids: number[],
	id: number,
	direction: Direction
): Promise<WriteResult> {
	const next = moved(ids, id, direction);
	if (!next) return ids.includes(id) ? 'ok' : 'not-found';
	for (const [i, rowId] of next.entries()) {
		await tx
			.update(table)
			.set({ sortOrder: (i + 1) * 10 })
			.where(eq(table.id, rowId));
	}
	await touchProfile(tx);
	return 'ok';
}

export function moveSection(id: number, direction: Direction): Promise<WriteResult> {
	return db.transaction(async (tx) => {
		const rows = await tx
			.select({ id: section.id })
			.from(section)
			.orderBy(asc(section.sortOrder), asc(section.id));
		return reorder(
			tx,
			section,
			rows.map((r) => r.id),
			id,
			direction
		);
	});
}

// --- Items: always scoped to the section in the URL ----------------------------------------
//
// update/delete/move match `id AND section_id`, so an item id from another section is
// 'not-found', never a cross-section edit.

function itemColumns(input: SectionItemInput) {
	return {
		titleEn: input.titleEn,
		titleSv: input.titleSv,
		subtitleEn: nullIfBlank(input.subtitleEn),
		subtitleSv: nullIfBlank(input.subtitleSv),
		startDate: nullIfBlank(input.startDate),
		endDate: nullIfBlank(input.endDate),
		link: nullIfBlank(input.link),
		descriptionEn: nullIfBlank(input.descriptionEn),
		descriptionSv: nullIfBlank(input.descriptionSv)
	};
}

const inSection = (sectionId: number, id: number) =>
	and(eq(sectionItem.id, id), eq(sectionItem.sectionId, sectionId));

export function createItem(sectionId: number, input: SectionItemInput): Promise<WriteResult> {
	return db.transaction(async (tx) => {
		const exists = await tx
			.select({ id: section.id })
			.from(section)
			.where(eq(section.id, sectionId));
		if (exists.length === 0) return 'not-found';
		const [{ last }] = await tx
			.select({ last: max(sectionItem.sortOrder) })
			.from(sectionItem)
			.where(eq(sectionItem.sectionId, sectionId));
		await tx
			.insert(sectionItem)
			.values({ ...itemColumns(input), sectionId, sortOrder: (last ?? 0) + 10 });
		await touchProfile(tx);
		return 'ok';
	});
}

export function updateItem(
	sectionId: number,
	id: number,
	input: SectionItemInput
): Promise<WriteResult> {
	return db.transaction(async (tx) => {
		const updated = await tx
			.update(sectionItem)
			.set(itemColumns(input))
			.where(inSection(sectionId, id))
			.returning({ id: sectionItem.id });
		if (updated.length === 0) return 'not-found';
		await touchProfile(tx);
		return 'ok';
	});
}

export function deleteItem(sectionId: number, id: number): Promise<WriteResult> {
	return db.transaction(async (tx) => {
		const deleted = await tx
			.delete(sectionItem)
			.where(inSection(sectionId, id))
			.returning({ id: sectionItem.id });
		if (deleted.length === 0) return 'not-found';
		await touchProfile(tx);
		return 'ok';
	});
}

export function moveItem(
	sectionId: number,
	id: number,
	direction: Direction
): Promise<WriteResult> {
	return db.transaction(async (tx) => {
		const rows = await tx
			.select({ id: sectionItem.id })
			.from(sectionItem)
			.where(eq(sectionItem.sectionId, sectionId))
			.orderBy(asc(sectionItem.sortOrder), asc(sectionItem.id));
		return reorder(
			tx,
			sectionItem,
			rows.map((r) => r.id),
			id,
			direction
		);
	});
}
