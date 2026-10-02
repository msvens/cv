import { localeOf, type Language } from '$lib/i18n';
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

/**
 * The resume owner's timezone. Timestamps are shown on the owner's calendar for every visitor
 * (a fork changes this one line), and pinning it means the server and the browser format the
 * same instant identically — otherwise a save near midnight at a month boundary could render as
 * one month in the SSR HTML and another after hydration.
 */
export const OWNER_TIMEZONE = 'Europe/Stockholm';

/** "Apr 2026" / "apr. 2026" — a timestamp's month and year in the page language. */
export function formatMonthYear(date: Date, lang: Language): string {
	return date.toLocaleDateString(localeOf(lang), {
		month: 'short',
		year: 'numeric',
		timeZone: OWNER_TIMEZONE
	});
}
