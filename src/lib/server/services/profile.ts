import { db } from '$lib/server/db/client';
import { profile } from '$lib/server/db/schema';

export async function getProfile() {
	const rows = await db.select().from(profile).limit(1);
	return rows[0] ?? null;
}
