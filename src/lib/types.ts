import type { InferSelectModel } from 'drizzle-orm';
import type {
	application,
	applicationContact,
	applicationStatusChange,
	letter,
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
export type ApplicationContact = InferSelectModel<typeof applicationContact>;
export type Letter = InferSelectModel<typeof letter>;
