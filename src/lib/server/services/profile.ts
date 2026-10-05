import { eq, isNull, or, sql } from 'drizzle-orm';
import { db } from '$lib/server/db/client';
import { profile } from '$lib/server/db/schema';
import type { ProfileData } from '$lib/types';
import { nullIfBlank } from '$lib/server/forms';
import type { ProfileInput } from '$lib/validation/schemas';

// Explicit return type: `rows[0]` is typed as always present, so without it TypeScript infers
// `ProfileData` and every "no profile" check goes unchecked.
export async function getProfile(): Promise<ProfileData | null> {
	const rows = await db.select().from(profile).limit(1);
	return rows[0] ?? null;
}

/**
 * Set profile.github to the admin's GitHub login, but only if it is empty: an existing value
 * (even a different one) is never overwritten. Not a content edit, so `updatedAt` is untouched.
 */
export async function fillGithubIfEmpty(login: string): Promise<void> {
	await db
		.update(profile)
		.set({ github: login })
		.where(or(isNull(profile.github), eq(sql`trim(${profile.github})`, '')));
}

/**
 * Save the profile form. Blank optional fields become NULL, and `updatedAt` moves, so the
 * footer's "Updated" reflects the edit. Returns false when there is no profile row to update.
 */
export async function updateProfile(input: ProfileInput): Promise<boolean> {
	const existing = await getProfile();
	if (!existing) return false;
	await db
		.update(profile)
		.set({
			...input,
			phone: nullIfBlank(input.phone),
			github: nullIfBlank(input.github),
			linkedin: nullIfBlank(input.linkedin),
			photoUrl: nullIfBlank(input.photoUrl),
			updatedAt: new Date()
		})
		.where(eq(profile.id, existing.id));
	return true;
}
