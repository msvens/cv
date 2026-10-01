import type { Language } from '$lib/i18n';
import { getTranslation } from '$lib/translations';

// Dates are Postgres `date` columns in string mode ('YYYY-MM-DD'). Read the year from the
// string rather than `new Date(iso)`, which parses as UTC midnight and can shift a day
// (and, on 1 January, a year) in negative-offset timezones.
const yearOf = (iso: string) => iso.slice(0, 4);

export function formatDateRange(
	startDate?: string | null,
	endDate?: string | null,
	lang: Language = 'en'
): string | null {
	if (!startDate && !endDate) return null;

	if (startDate && endDate) return `${yearOf(startDate)} — ${yearOf(endDate)}`;
	if (startDate) return `${yearOf(startDate)} — ${getTranslation(lang).resume.present}`;
	return yearOf(endDate!);
}
