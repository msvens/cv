import type { MdBlock } from '$lib/markdown';

/**
 * The public resume, already resolved for one language: components receive plain strings and
 * parsed markdown, never `titleEn`/`titleSv` pairs. Built on the server by `buildResumeView`.
 */
export interface ResumeView {
	header: HeaderView;
	sections: SectionView[];
}

export interface HeaderView {
	name: string;
	title: string;
	email: string;
	phone: string | null;
	location: string;
	photoUrl: string | null;
	available: boolean;
	bio: MdBlock[];
}

export type SectionView =
	| { id: number; label: string; kind: 'entries'; entries: EntryView[] }
	| { id: number; label: string; kind: 'chips'; chips: string[] };

export interface EntryView {
	id: number;
	title: string;
	subtitle: string | null;
	dateRange: string | null;
	link: string | null;
	description: MdBlock[] | null;
}
