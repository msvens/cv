/** Every status, in the order an application usually moves through them. */
export const STATUSES = [
	'not_applied',
	'applied',
	'interviewing',
	'offer',
	'accepted',
	'rejected',
	'withdrawn'
] as const;

export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
	not_applied: 'Not applied',
	applied: 'Applied',
	interviewing: 'Interviewing',
	offer: 'Offer',
	accepted: 'Accepted',
	rejected: 'Rejected',
	withdrawn: 'Withdrawn'
};

const CLOSED = new Set<string>(['accepted', 'rejected', 'withdrawn']);

/** Still in play. Closed = accepted, rejected or withdrawn. */
export function isActive(status: string): boolean {
	return !CLOSED.has(status);
}

/** A stored status as a label; an unknown value (e.g. a status since removed) shows as-is. */
export function statusLabel(status: string): string {
	return (STATUS_LABELS as Record<string, string>)[status] ?? status;
}

type Sortable = { status: string; deadline: string | null; createdAt: Date; updatedAt: Date };

/**
 * The list page's two groups. Active: soonest deadline first, those without a deadline last,
 * ties newest first. Closed: most recently updated first. ISO dates compare as strings.
 */
export function groupApplications<A extends Sortable>(list: A[]): { active: A[]; closed: A[] } {
	const active = list
		.filter((a) => isActive(a.status))
		.sort((a, b) => {
			if (a.deadline !== b.deadline) {
				if (!a.deadline) return 1;
				if (!b.deadline) return -1;
				return a.deadline < b.deadline ? -1 : 1;
			}
			return b.createdAt.getTime() - a.createdAt.getTime();
		});
	const closed = list
		.filter((a) => !isActive(a.status))
		.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
	return { active, closed };
}

export type Attention = 'overdue' | 'soon';

/** Whole days from one 'YYYY-MM-DD' to another, on the calendar (no timezone or DST shift). */
function daysBetween(from: string, to: string): number {
	const utc = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
	return Math.round((utc(to) - utc(from)) / 86_400_000);
}

/**
 * Does the application need attention? Only one not yet applied for, with a deadline: past it
 * is `overdue`; from `windowDays` days before it up to the day itself it is `soon`.
 */
export function attention(
	app: { status: string; deadline: string | null },
	today: string,
	windowDays: number
): { kind: Attention; days: number } | null {
	if (app.status !== 'not_applied' || !app.deadline) return null;
	const days = daysBetween(today, app.deadline);
	if (days < 0) return { kind: 'overdue', days };
	if (days <= windowDays) return { kind: 'soon', days };
	return null;
}

/** The applications needing attention, most urgent first (the most overdue, then soonest). */
export function needsAttention<A extends { status: string; deadline: string | null }>(
	list: A[],
	today: string,
	windowDays: number
): { application: A; kind: Attention; days: number }[] {
	return list
		.flatMap((application) => {
			const a = attention(application, today, windowDays);
			return a ? [{ application, ...a }] : [];
		})
		.sort((a, b) => a.days - b.days);
}

/** "Overdue by 2 days", "Deadline today", "Deadline in 3 days". */
export function attentionLabel({ kind, days }: { kind: Attention; days: number }): string {
	const plural = (n: number) => (n === 1 ? '1 day' : `${n} days`);
	if (kind === 'overdue') return `Overdue by ${plural(-days)}`;
	return days === 0 ? 'Deadline today' : `Deadline in ${plural(days)}`;
}
