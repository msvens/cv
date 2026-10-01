import { describe, expect, it } from 'vitest';
import { formatDateRange } from '../dates';

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
