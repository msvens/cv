import { and, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db/client';
import { applicationSnapshot } from '$lib/server/db/schema';
import type { RenderedPdf } from '$lib/server/applicationPdf';
import type { Snapshot } from '$lib/types';
import { touchApplication } from './applications';

// Snapshots are written once and never updated (R8). Every read goes through the application's
// id as well as the snapshot's, so one application's page can't serve another's snapshot.

const listColumns = {
	id: applicationSnapshot.id,
	applicationId: applicationSnapshot.applicationId,
	kind: applicationSnapshot.kind,
	language: applicationSnapshot.language,
	filename: applicationSnapshot.filename,
	createdAt: applicationSnapshot.createdAt
};

export function saveSnapshot(
	applicationId: number,
	{ pdf, filename, kind, language }: RenderedPdf
): Promise<'ok' | 'not-found'> {
	return db.transaction(async (tx) => {
		if (!(await touchApplication(tx, applicationId))) return 'not-found';
		await tx
			.insert(applicationSnapshot)
			.values({ applicationId, kind, language, filename, data: new Uint8Array(pdf) });
		return 'ok';
	});
}

/** The application's snapshots, newest first, without their bytes. */
export function listSnapshots(applicationId: number): Promise<Snapshot[]> {
	return db
		.select(listColumns)
		.from(applicationSnapshot)
		.where(eq(applicationSnapshot.applicationId, applicationId))
		.orderBy(desc(applicationSnapshot.createdAt), desc(applicationSnapshot.id));
}

/** One snapshot with its bytes, only through its own application. */
export async function getSnapshot(applicationId: number, snapshotId: number) {
	const [row] = await db
		.select()
		.from(applicationSnapshot)
		.where(ownSnapshot(applicationId, snapshotId));
	return row ?? null;
}

export function deleteSnapshot(
	applicationId: number,
	snapshotId: number
): Promise<'ok' | 'not-found'> {
	return db.transaction(async (tx) => {
		const rows = await tx
			.delete(applicationSnapshot)
			.where(ownSnapshot(applicationId, snapshotId))
			.returning({ id: applicationSnapshot.id });
		if (rows.length === 0) return 'not-found';
		await touchApplication(tx, applicationId);
		return 'ok';
	});
}

function ownSnapshot(applicationId: number, snapshotId: number) {
	return and(
		eq(applicationSnapshot.id, snapshotId),
		eq(applicationSnapshot.applicationId, applicationId)
	);
}
