import { and, desc, eq, ne } from 'drizzle-orm';
import { db } from '$lib/server/db/client';
import { application, applicationContact, letter } from '$lib/server/db/schema';
import type { Letter } from '$lib/types';
import type { LetterInput } from '$lib/validation/schemas';
import { touchApplication } from './applications';

// Like the rest of the applications, nothing here touches `profile.updatedAt`.

export async function getLetter(applicationId: number): Promise<Letter | null> {
	const [row] = await db.select().from(letter).where(eq(letter.applicationId, applicationId));
	return row ?? null;
}

/**
 * Create or update the application's one letter. The recipient must be one of this
 * application's own contacts ('bad-contact' otherwise), so a crafted form can't address the
 * letter to someone else's.
 */
export function saveLetter(
	applicationId: number,
	input: LetterInput
): Promise<'ok' | 'not-found' | 'bad-contact'> {
	return db.transaction(async (tx) => {
		if (!(await touchApplication(tx, applicationId))) return 'not-found';
		if (input.recipientContactId !== null) {
			const [contact] = await tx
				.select({ id: applicationContact.id })
				.from(applicationContact)
				.where(
					and(
						eq(applicationContact.id, input.recipientContactId),
						eq(applicationContact.applicationId, applicationId)
					)
				);
			if (!contact) return 'bad-contact';
		}
		const values = { ...input, updatedAt: new Date() };
		await tx
			.insert(letter)
			.values({ applicationId, ...values })
			.onConflictDoUpdate({ target: letter.applicationId, set: values });
		return 'ok';
	});
}

export function deleteLetter(applicationId: number): Promise<'ok' | 'not-found'> {
	return db.transaction(async (tx) => {
		const rows = await tx
			.delete(letter)
			.where(eq(letter.applicationId, applicationId))
			.returning({ id: letter.id });
		if (rows.length === 0) return 'not-found';
		await touchApplication(tx, applicationId);
		return 'ok';
	});
}

export interface LetterSource {
	applicationId: number;
	company: string;
	role: string;
	language: string;
	updatedAt: Date;
}

/** The other applications' letters, newest first: what a new letter can start from. */
export function listLetterSources(exceptApplicationId: number): Promise<LetterSource[]> {
	return db
		.select({
			applicationId: letter.applicationId,
			company: application.company,
			role: application.role,
			language: letter.language,
			updatedAt: letter.updatedAt
		})
		.from(letter)
		.innerJoin(application, eq(application.id, letter.applicationId))
		.where(ne(letter.applicationId, exceptApplicationId))
		.orderBy(desc(letter.updatedAt));
}

/**
 * Start the application's letter as a copy of another application's: body and language only.
 * The options stay at their defaults, since the recipient belonged to the other application.
 * Only for an application without a letter ('exists' otherwise).
 */
export function copyLetter(
	applicationId: number,
	fromApplicationId: number
): Promise<'ok' | 'not-found' | 'exists'> {
	return db.transaction(async (tx) => {
		const [source] = await tx
			.select({ language: letter.language, body: letter.body })
			.from(letter)
			.where(eq(letter.applicationId, fromApplicationId));
		if (!source || fromApplicationId === applicationId) return 'not-found';
		const [existing] = await tx
			.select({ id: letter.id })
			.from(letter)
			.where(eq(letter.applicationId, applicationId));
		if (existing) return 'exists';
		if (!(await touchApplication(tx, applicationId))) return 'not-found';
		const rows = await tx
			.insert(letter)
			.values({ applicationId, ...source })
			.onConflictDoNothing({ target: letter.applicationId })
			.returning({ id: letter.id });
		return rows.length ? 'ok' : 'exists';
	});
}
