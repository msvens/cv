import type { InferSelectModel } from 'drizzle-orm';
import type { profile, section, sectionItem } from '$lib/server/db/schema';

export type ProfileData = InferSelectModel<typeof profile>;
export type SectionData = InferSelectModel<typeof section>;
export type SectionItemData = InferSelectModel<typeof sectionItem>;

export type SectionWithItems = SectionData & {
	items: SectionItemData[];
};
