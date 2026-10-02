import { describe, expect, it, vi } from 'vitest';
import { formatDateRange, formatMonthYear, OWNER_TIMEZONE } from '../dates';

describe('formatDateRange', () => {
	it('returns null when there are no dates', () => {
		expect(formatDateRange(null, null)).toBeNull();
	});

	it('formats a closed range as years', () => {
		expect(formatDateRange('2015-03-01', '2019-08-31')).toBe('2015 — 2019');
	});

	it('uses the localized "present" for an open range', () => {
		expect(formatDateRange('2020-01-01', null, 'en')).toBe('2020 — Present');
		expect(formatDateRange('2020-01-01', null, 'sv')).toBe('2020 — Nuvarande');
	});

	it('shows only the end year when there is no start', () => {
		expect(formatDateRange(null, '2010-06-30')).toBe('2010');
	});

	it('does not shift New Year dates into the previous year', () => {
		// new Date('2020-01-01') is UTC midnight — 2019 in any negative-offset timezone.
		expect(formatDateRange('2020-01-01', '2021-01-01')).toBe('2020 — 2021');
	});
});

describe('formatMonthYear', () => {
	const saved = new Date('2026-04-22T07:51:59Z');

	it('formats month and year in the page language', () => {
		expect(formatMonthYear(saved, 'en')).toBe('Apr 2026');
		expect(formatMonthYear(saved, 'sv')).toBe('apr. 2026');
	});

	// Tests run with TZ=Europe/Stockholm, so an unpinned formatter would produce the same output
	// here — assert the pin itself rather than relying on the process timezone.
	it("formats in the owner's timezone, not the process's", () => {
		const spy = vi.spyOn(Date.prototype, 'toLocaleDateString');
		formatMonthYear(saved, 'en');
		expect(spy).toHaveBeenCalledWith(
			'en-US',
			expect.objectContaining({ timeZone: OWNER_TIMEZONE })
		);
		spy.mockRestore();
	});

	it("uses the owner's calendar at a month boundary", () => {
		// 00:30 on 1 May in Stockholm, still 30 April in UTC: an unpinned server in UTC would
		// render April while a Stockholm browser re-renders May.
		const boundary = new Date('2026-04-30T22:30:00Z');
		const inUtc = boundary.toLocaleDateString('en-US', {
			month: 'short',
			year: 'numeric',
			timeZone: 'UTC'
		});
		expect(inUtc).toBe('Apr 2026');
		expect(formatMonthYear(boundary, 'en')).toBe('May 2026');
	});
});
