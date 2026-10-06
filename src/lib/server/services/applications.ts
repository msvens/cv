import { and, asc, eq, isNull } from 'drizzle-orm';
import type { Status } from '$lib/applications';
import { db } from '$lib/server/db/client';
import { application, applicationStatusChange } from '$lib/server/db/schema';
import { nullIfBlank } from '$lib/server/forms';
import type { ApplicationData, StatusChange } from '$lib/types';
import type { ApplicationInput, NewApplicationInput } from '$lib/validation/schemas';

// Nothing here touches `profile.updatedAt`: it is the public footer's "Updated" date and must
// not reveal job-search activity.

export function listApplications(): Promise<ApplicationData[]> {
	return db.select().from(application);
}

export async function getApplication(id: number): Promise<ApplicationData | null> {
	const rows = await db.select().from(application).where(eq(application.id, id));
	return rows[0] ?? null;
}

/** The application's timeline, oldest first. */
export function listStatusChanges(applicationId: number): Promise<StatusChange[]> {
	return db
		.select()
		.from(applicationStatusChange)
		.where(eq(applicationStatusChange.applicationId, applicationId))
		.orderBy(asc(applicationStatusChange.changedAt), asc(applicationStatusChange.id));
}

/** A new application (Not applied), with its first timeline entry. Returns its id. */
export function createApplication(data: NewApplicationInput): Promise<number> {
	return db.transaction(async (tx) => {
		const [{ id }] = await tx.insert(application).values(data).returning({ id: application.id });
		await tx.insert(applicationStatusChange).values({ applicationId: id, status: 'not_applied' });
		return id;
	});
}

/** The details; the status is changed only through `changeStatus`, so it lands on the timeline. */
export async function updateApplication(
	id: number,
	data: ApplicationInput
): Promise<'ok' | 'not-found'> {
	const rows = await db
		.update(application)
		.set({
			company: data.company,
			role: data.role,
			adUrl: nullIfBlank(data.adUrl),
			location: nullIfBlank(data.location),
			deadline: nullIfBlank(data.deadline),
			appliedOn: nullIfBlank(data.appliedOn),
			notes: nullIfBlank(data.notes),
			adText: nullIfBlank(data.adText),
			updatedAt: new Date()
		})
		.where(eq(application.id, id))
		.returning({ id: application.id });
	return rows.length ? 'ok' : 'not-found';
}

/**
 * Moves the application to `status` and records it on the timeline; the same status again
 * records nothing. Applied fills the applied date with `today` unless one is already set.
 */
export function changeStatus(
	id: number,
	status: Status,
	today: string
): Promise<'ok' | 'not-found'> {
	return db.transaction(async (tx) => {
		const [current] = await tx
			.select({ status: application.status })
			.from(application)
			.where(eq(application.id, id));
		if (!current) return 'not-found';
		if (current.status === status) return 'ok';

		await tx
			.update(application)
			.set({ status, updatedAt: new Date() })
			.where(eq(application.id, id));
		if (status === 'applied') {
			await tx
				.update(application)
				.set({ appliedOn: today })
				.where(and(eq(application.id, id), isNull(application.appliedOn)));
		}
		await tx.insert(applicationStatusChange).values({ applicationId: id, status });
		return 'ok';
	});
}

/** Deletes the application; its timeline goes with it (ON DELETE CASCADE). */
export async function deleteApplication(id: number): Promise<'ok' | 'not-found'> {
	const rows = await db
		.delete(application)
		.where(eq(application.id, id))
		.returning({ id: application.id });
	return rows.length ? 'ok' : 'not-found';
}
