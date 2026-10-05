import { beforeEach, describe, expect, it, vi } from 'vitest';
import { profileSeed } from '$lib/server/db/seed-data';
import { profile, profilePhoto } from '$lib/server/db/schema';
import { db, resetDb } from '$lib/server/testing/testDb';
import { getProfile } from '../profile';
import { getPhoto, removePhoto, savePhoto, setPhotoUrl } from '../photo';

vi.mock('$lib/server/db/client', () => import('$lib/server/testing/testDb'));

const OLD = new Date('2026-01-01T00:00:00Z');
const jpeg = (byte: number) =>
	({ data: new Uint8Array([0xff, 0xd8, byte]), contentType: 'image/jpeg' }) as const;

beforeEach(async () => {
	await resetDb();
	await db.insert(profile).values({ ...profileSeed, updatedAt: OLD });
});

describe('photo service', () => {
	it('stores an upload and points the profile at a versioned /photo URL', async () => {
		const url = await savePhoto(jpeg(1));
		expect(url).toMatch(/^\/photo\?v=[0-9a-f]{12}$/);
		const p = await getProfile();
		expect(p?.photoUrl).toBe(url);
		expect(p!.updatedAt.getTime()).toBeGreaterThan(OLD.getTime());
		expect((await getPhoto())?.data).toEqual(new Uint8Array([0xff, 0xd8, 1]));
	});

	it('replaces the previous upload, with a new version for new content', async () => {
		const first = await savePhoto(jpeg(1));
		const second = await savePhoto(jpeg(2));
		expect(second).not.toBe(first);
		expect(await db.select().from(profilePhoto)).toHaveLength(1);
		expect((await getPhoto())?.data).toEqual(new Uint8Array([0xff, 0xd8, 2]));
	});

	it('links an image URL instead, removing any upload', async () => {
		await savePhoto(jpeg(1));
		await setPhotoUrl('https://www.mellowtech.org/api/thumbs/x.jpg');
		expect((await getProfile())?.photoUrl).toBe('https://www.mellowtech.org/api/thumbs/x.jpg');
		expect(await getPhoto()).toBeNull();
	});

	it('removes the photo entirely', async () => {
		await savePhoto(jpeg(1));
		await removePhoto();
		expect((await getProfile())?.photoUrl).toBeNull();
		expect(await getPhoto()).toBeNull();
	});
});
