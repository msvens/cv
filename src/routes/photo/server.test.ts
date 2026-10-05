import { beforeEach, describe, expect, it, vi } from 'vitest';
import { profileSeed } from '$lib/server/db/seed-data';
import { profile } from '$lib/server/db/schema';
import { savePhoto } from '$lib/server/services/photo';
import { fakeEvent } from '$lib/server/testing/fakeEvent';
import { db, resetDb } from '$lib/server/testing/testDb';
import { GET } from './+server';

vi.mock('$lib/server/db/client', () => import('$lib/server/testing/testDb'));

beforeEach(async () => {
	await resetDb();
	await db.insert(profile).values(profileSeed);
});

describe('GET /photo', () => {
	it('serves the uploaded photo, cacheable for good (its URL is versioned)', async () => {
		await savePhoto({ data: new Uint8Array([0xff, 0xd8, 7]), contentType: 'image/jpeg' });
		const res = await GET(fakeEvent({ url: 'http://localhost/photo?v=x' }));
		expect(res.headers.get('content-type')).toBe('image/jpeg');
		expect(res.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
		expect(new Uint8Array(await res.arrayBuffer())).toEqual(new Uint8Array([0xff, 0xd8, 7]));
	});

	it('is a 404 without an uploaded photo', async () => {
		await expect(GET(fakeEvent({ url: 'http://localhost/photo' }))).rejects.toMatchObject({
			status: 404
		});
	});
});
