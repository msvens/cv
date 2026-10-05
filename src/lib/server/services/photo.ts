import { createHash } from 'node:crypto';
import { db } from '$lib/server/db/client';
import { profile, profilePhoto } from '$lib/server/db/schema';
import type { ProcessedPhoto } from '$lib/server/photo';

// There is only ever one photo: an uploaded one (stored here, served at /photo) or an image URL
// linked as-is. profile.photoUrl says which, so everything that shows the photo just reads it.
// Each change also moves profile.updatedAt, like any other resume edit.

export async function getPhoto() {
	const rows = await db.select().from(profilePhoto).limit(1);
	return rows[0] ?? null;
}

/** Store an uploaded (processed) photo, replacing any previous one or any linked URL. */
export async function savePhoto(photo: ProcessedPhoto): Promise<string> {
	// Versioned by content, so browsers fetch a new photo at once and can cache each forever.
	const version = createHash('sha256').update(photo.data).digest('hex').slice(0, 12);
	const url = `/photo?v=${version}`;
	await db.transaction(async (tx) => {
		await tx.delete(profilePhoto);
		await tx.insert(profilePhoto).values(photo);
		await tx.update(profile).set({ photoUrl: url, updatedAt: new Date() });
	});
	return url;
}

/** Link an existing image instead of storing one; any uploaded photo is removed. */
export async function setPhotoUrl(url: string): Promise<void> {
	await db.transaction(async (tx) => {
		await tx.delete(profilePhoto);
		await tx.update(profile).set({ photoUrl: url, updatedAt: new Date() });
	});
}

/** No photo at all. */
export async function removePhoto(): Promise<void> {
	await db.transaction(async (tx) => {
		await tx.delete(profilePhoto);
		await tx.update(profile).set({ photoUrl: null, updatedAt: new Date() });
	});
}
