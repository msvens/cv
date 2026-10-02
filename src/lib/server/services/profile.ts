import { db } from '$lib/server/db/client';
import { profile } from '$lib/server/db/schema';
import type { ProfileData } from '$lib/types';

// Explicit return type: `rows[0]` is typed as always present, so without it TypeScript infers
// `ProfileData` and every "no profile" check goes unchecked.
export async function getProfile(): Promise<ProfileData | null> {
	const rows = await db.select().from(profile).limit(1);
	return rows[0] ?? null;
}
