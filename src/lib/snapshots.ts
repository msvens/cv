/** What a snapshot holds (R8). Stored as text, checked here, like the statuses. */
export const SNAPSHOT_KINDS = ['letter', 'letter+cv', 'cv'] as const;
export type SnapshotKind = (typeof SNAPSHOT_KINDS)[number];

export const SNAPSHOT_LABELS: Record<SnapshotKind, string> = {
	letter: 'Letter',
	'letter+cv': 'Letter + CV',
	cv: 'CV only'
};

export function snapshotLabel(kind: string): string {
	return (SNAPSHOT_LABELS as Record<string, string>)[kind] ?? kind;
}
