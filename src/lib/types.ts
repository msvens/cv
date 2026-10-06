import type { InferSelectModel } from 'drizzle-orm';
import type {
	application,
	applicationStatusChange,
	profile,
	section,
	sectionItem
} from '$lib/server/db/schema';

export type ProfileData = InferSelectModel<typeof profile>;
export type SectionData = InferSelectModel<typeof section>;
export type SectionItemData = InferSelectModel<typeof sectionItem>;

export type SectionWithItems = SectionData & {
	items: SectionItemData[];
};

export type ApplicationData = InferSelectModel<typeof application>;
export type StatusChange = InferSelectModel<typeof applicationStatusChange>;
