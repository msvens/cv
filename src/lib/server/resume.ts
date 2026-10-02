import { formatDateRange } from '$lib/dates';
import type { Language } from '$lib/i18n';
import { safeHref } from '$lib/markdown';
import type { EntryView, ResumeView, SectionView } from '$lib/resume';
import { parseMarkdown } from '$lib/server/markdown';
import type { ProfileData, SectionItemData, SectionWithItems } from '$lib/types';

/** Optional text: blank becomes null, so components only need one "absent" check. */
const present = (value: string | null | undefined) => (value?.trim() ? value : null);

/**
 * Resolve the resume for one language. All en/sv picking happens here, once; markdown is
 * parsed into the safe element tree; item links are kept only if they are safe (http, https,
 * mailto).
 */
export function buildResumeView(
	profile: ProfileData,
	sections: SectionWithItems[],
	lang: Language
): ResumeView {
	const sv = lang === 'sv';
	return {
		header: {
			name: profile.name,
			title: sv ? profile.titleSv : profile.titleEn,
			email: profile.email,
			phone: present(profile.phone),
			location: sv ? profile.locationSv : profile.locationEn,
			photoUrl: present(profile.photoUrl),
			available: profile.available,
			bio: parseMarkdown(sv ? profile.bioSv : profile.bioEn)
		},
		sections: sections.map((section): SectionView => {
			const label = sv ? section.labelSv : section.labelEn;
			// Anything but 'chips' renders as entries, as in the old app.
			return section.displayType === 'chips'
				? {
						id: section.id,
						label,
						kind: 'chips',
						chips: section.items.map((item) => (sv ? item.titleSv : item.titleEn))
					}
				: {
						id: section.id,
						label,
						kind: 'entries',
						entries: section.items.map((item) => toEntry(item, lang))
					};
		})
	};
}

function toEntry(item: SectionItemData, lang: Language): EntryView {
	const sv = lang === 'sv';
	const description = present(sv ? item.descriptionSv : item.descriptionEn);
	return {
		id: item.id,
		title: sv ? item.titleSv : item.titleEn,
		subtitle: present(sv ? item.subtitleSv : item.subtitleEn),
		dateRange: formatDateRange(item.startDate, item.endDate, lang),
		link: item.link ? safeHref(item.link) : null,
		description: description ? parseMarkdown(description) : null
	};
}
