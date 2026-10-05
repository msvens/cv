import { fail } from '@sveltejs/kit';
import { checkbox, text, type FieldErrors } from '$lib/server/forms';
import type { Direction } from '$lib/server/services/sections';

/** The section form's fields, as the list page (create) and detail page (update) submit them. */
export function sectionValues(form: FormData) {
	return {
		slug: text(form, 'slug'),
		labelEn: text(form, 'labelEn'),
		labelSv: text(form, 'labelSv'),
		displayType: text(form, 'displayType'),
		visible: checkbox(form, 'visible'),
		showInPdf: checkbox(form, 'showInPdf')
	};
}

/** The item form's fields. Chip sections only show the titles; the rest then arrive blank. */
export function itemValues(form: FormData) {
	return {
		titleEn: text(form, 'titleEn'),
		titleSv: text(form, 'titleSv'),
		subtitleEn: text(form, 'subtitleEn'),
		subtitleSv: text(form, 'subtitleSv'),
		startDate: text(form, 'startDate'),
		endDate: text(form, 'endDate'),
		link: text(form, 'link'),
		descriptionEn: text(form, 'descriptionEn'),
		descriptionSv: text(form, 'descriptionSv')
	};
}

/** A duplicate slug as a field error on the form, not a 500 (#18). */
export function slugTaken<V extends Record<string, unknown>>(values: V, target?: string) {
	const errors: FieldErrors = { slug: ['Another section already uses this slug'] };
	return fail(400, { values, errors, target });
}

export function direction(form: FormData): Direction | null {
	const value = text(form, 'direction');
	return value === 'up' || value === 'down' ? value : null;
}
