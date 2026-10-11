import { describe, expect, it } from 'vitest';
import {
	attention,
	attentionLabel,
	groupApplications,
	isActive,
	needsAttention,
	STATUSES,
	statusLabel
} from '../applications';

const app = (
	id: number,
	status: string,
	deadline: string | null,
	created = '2026-01-01',
	updated = created
) => ({
	id,
	status,
	deadline,
	createdAt: new Date(`${created}T12:00:00Z`),
	updatedAt: new Date(`${updated}T12:00:00Z`)
});
const ids = (list: { id: number }[]) => list.map((a) => a.id);

describe('isActive', () => {
	it.each([
		['not_applied', true],
		['applied', true],
		['interviewing', true],
		['offer', true],
		['accepted', false],
		['rejected', false],
		['withdrawn', false]
	])('%s → %s', (status, active) => {
		expect(isActive(status)).toBe(active);
	});

	it('covers every status', () => {
		expect(STATUSES).toHaveLength(7);
	});
});

describe('statusLabel', () => {
	it('labels known statuses and shows unknown ones as stored', () => {
		expect(statusLabel('not_applied')).toBe('Not applied');
		expect(statusLabel('ghosted')).toBe('ghosted');
	});
});

describe('groupApplications', () => {
	it('splits active from closed', () => {
		const { active, closed } = groupApplications([
			app(1, 'applied', null),
			app(2, 'rejected', null),
			app(3, 'offer', null),
			app(4, 'withdrawn', null)
		]);
		expect(ids(active).sort()).toEqual([1, 3]);
		expect(ids(closed).sort()).toEqual([2, 4]);
	});

	it('orders active by deadline, soonest first, with no deadline last', () => {
		const { active } = groupApplications([
			app(1, 'applied', null),
			app(2, 'not_applied', '2026-11-01'),
			app(3, 'not_applied', '2026-10-10'),
			app(4, 'interviewing', null, '2026-03-01')
		]);
		// Without a deadline: newest first.
		expect(ids(active)).toEqual([3, 2, 4, 1]);
	});

	it('breaks a deadline tie by newest first', () => {
		const { active } = groupApplications([
			app(1, 'applied', '2026-10-10', '2026-01-01'),
			app(2, 'applied', '2026-10-10', '2026-02-01')
		]);
		expect(ids(active)).toEqual([2, 1]);
	});

	it('orders closed by most recently updated', () => {
		const { closed } = groupApplications([
			app(1, 'rejected', null, '2026-01-01', '2026-02-01'),
			app(2, 'accepted', null, '2026-01-01', '2026-05-01'),
			app(3, 'withdrawn', null, '2026-01-01', '2026-03-01')
		]);
		expect(ids(closed)).toEqual([2, 3, 1]);
	});
});

describe('attention', () => {
	const today = '2026-10-09';
	const open = (deadline: string | null) => ({ status: 'not_applied', deadline });

	it('only counts applications not yet applied for, with a deadline', () => {
		for (const status of STATUSES.filter((s) => s !== 'not_applied')) {
			expect(attention({ status, deadline: '2026-10-08' }, today, 7)).toBeNull();
		}
		expect(attention(open(null), today, 7)).toBeNull();
	});

	it('is overdue after the deadline, and soon on the day itself', () => {
		expect(attention(open('2026-10-08'), today, 7)).toEqual({ kind: 'overdue', days: -1 });
		expect(attention(open('2026-10-09'), today, 7)).toEqual({ kind: 'soon', days: 0 });
	});

	it('includes the last day of the window and nothing after it', () => {
		expect(attention(open('2026-10-16'), today, 7)).toEqual({ kind: 'soon', days: 7 });
		expect(attention(open('2026-10-17'), today, 7)).toBeNull();
		expect(attention(open('2026-10-10'), today, 1)).toEqual({ kind: 'soon', days: 1 });
		expect(attention(open('2026-10-11'), today, 1)).toBeNull();
	});

	it('counts calendar days across a month end and the DST change', () => {
		// Sweden leaves summer time on 2026-10-25.
		expect(attention(open('2026-10-26'), '2026-10-24', 7)?.days).toBe(2);
		expect(attention(open('2026-11-02'), '2026-10-30', 7)?.days).toBe(3);
	});
});

describe('needsAttention', () => {
	it('lists only those needing attention, most overdue first, then soonest', () => {
		const list = [
			{ id: 1, status: 'not_applied', deadline: '2026-10-12' },
			{ id: 2, status: 'applied', deadline: '2026-10-01' },
			{ id: 3, status: 'not_applied', deadline: '2026-10-05' },
			{ id: 4, status: 'not_applied', deadline: '2026-10-09' },
			{ id: 5, status: 'not_applied', deadline: '2026-12-01' },
			{ id: 6, status: 'not_applied', deadline: '2026-10-08' }
		];
		expect(needsAttention(list, '2026-10-09', 7).map((a) => a.application.id)).toEqual([
			3, 6, 4, 1
		]);
	});
});

describe('attentionLabel', () => {
	it('says how overdue or how soon', () => {
		expect(attentionLabel({ kind: 'overdue', days: -1 })).toBe('Overdue by 1 day');
		expect(attentionLabel({ kind: 'overdue', days: -3 })).toBe('Overdue by 3 days');
		expect(attentionLabel({ kind: 'soon', days: 0 })).toBe('Deadline today');
		expect(attentionLabel({ kind: 'soon', days: 1 })).toBe('Deadline in 1 day');
		expect(attentionLabel({ kind: 'soon', days: 5 })).toBe('Deadline in 5 days');
	});
});
