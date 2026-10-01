import { and, asc, eq, inArray, type SQL } from 'drizzle-orm';
import { db } from '$lib/server/db/client';
import { section, sectionItem } from '$lib/server/db/schema';
import type { SectionItemData, SectionWithItems } from '$lib/types';

export async function listSections() {
	return db.select().from(section).orderBy(asc(section.sortOrder));
}

export async function getSection(id: number) {
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

export async function getSectionItem(id: number) {
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
	return sectionsWithItems(and(eq(section.showInPdf, true)));
}
