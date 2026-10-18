import { and, asc, eq, isNull } from 'drizzle-orm';
import type { Status } from '$lib/applications';
import { db } from '$lib/server/db/client';
import { application, applicationContact, applicationStatusChange } from '$lib/server/db/schema';
import { nullIfBlank } from '$lib/server/forms';
import type { ApplicationContact, ApplicationData, StatusChange } from '$lib/types';
import type { ApplicationInput, ContactInput, NewApplicationInput } from '$lib/validation/schemas';

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

/** Deletes the application; its timeline and contacts go with it (ON DELETE CASCADE). */
export async function deleteApplication(id: number): Promise<'ok' | 'not-found'> {
	const rows = await db
		.delete(application)
		.where(eq(application.id, id))
		.returning({ id: application.id });
	return rows.length ? 'ok' : 'not-found';
}

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Marks the application as just worked on (the list's order); false when it doesn't exist. */
export async function touchApplication(tx: Tx, id: number): Promise<boolean> {
	const rows = await tx
		.update(application)
		.set({ updatedAt: new Date() })
		.where(eq(application.id, id))
		.returning({ id: application.id });
	return rows.length > 0;
}

function contactColumns(input: ContactInput) {
	return {
		name: input.name,
		role: nullIfBlank(input.role),
		email: nullIfBlank(input.email),
		phone: nullIfBlank(input.phone),
		note: nullIfBlank(input.note)
	};
}

// Contacts are always addressed through their application: an id that belongs to another
// application is 'not-found', so a crafted form can't reach someone else's contact.
const ofApplication = (applicationId: number, id: number) =>
	and(eq(applicationContact.id, id), eq(applicationContact.applicationId, applicationId));

/** The application's contacts, in the order they were added. */
export function listContacts(applicationId: number): Promise<ApplicationContact[]> {
	return db
		.select()
		.from(applicationContact)
		.where(eq(applicationContact.applicationId, applicationId))
		.orderBy(asc(applicationContact.id));
}

export function addContact(
	applicationId: number,
	input: ContactInput
): Promise<'ok' | 'not-found'> {
	return db.transaction(async (tx) => {
		if (!(await touchApplication(tx, applicationId))) return 'not-found';
		await tx.insert(applicationContact).values({ applicationId, ...contactColumns(input) });
		return 'ok';
	});
}

export function updateContact(
	applicationId: number,
	id: number,
	input: ContactInput
): Promise<'ok' | 'not-found'> {
	return db.transaction(async (tx) => {
		const rows = await tx
			.update(applicationContact)
			.set(contactColumns(input))
			.where(ofApplication(applicationId, id))
			.returning({ id: applicationContact.id });
		if (rows.length === 0) return 'not-found';
		await touchApplication(tx, applicationId);
		return 'ok';
	});
}

export function deleteContact(applicationId: number, id: number): Promise<'ok' | 'not-found'> {
	return db.transaction(async (tx) => {
		const rows = await tx
			.delete(applicationContact)
			.where(ofApplication(applicationId, id))
			.returning({ id: applicationContact.id });
		if (rows.length === 0) return 'not-found';
		await touchApplication(tx, applicationId);
		return 'ok';
	});
}
