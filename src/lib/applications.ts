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
