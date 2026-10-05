import { isHttpError, type RequestEvent } from '@sveltejs/kit';
import sharp from 'sharp';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { profileSeed } from '$lib/server/db/seed-data';
import { profile } from '$lib/server/db/schema';
import { getPhoto } from '$lib/server/services/photo';
import { getProfile } from '$lib/server/services/profile';
import { fakeEvent } from '$lib/server/testing/fakeEvent';
import { db, resetDb } from '$lib/server/testing/testDb';
import { actions } from './+page.server';

vi.mock('$lib/server/db/client', () => import('$lib/server/testing/testDb'));
vi.mock('$app/env/private', () => ({ ADMIN_GITHUB_ID: '12345' }));

const user = (githubId: string) => ({
	id: `u-${githubId}`,
	name: 'Me',
	email: 'me@example.com',
	emailVerified: true,
	image: null,
	createdAt: new Date(),
	updatedAt: new Date(),
	githubId,
	githubLogin: 'me'
});
/** A form POST to the profile page's actions, from `as` (the admin by default). */
const post = <E extends RequestEvent>(form: Record<string, string | File>, as = user('12345')) =>
	fakeEvent<E>({ url: 'http://localhost/admin/profile', locals: { user: as }, form });

const photoFile = async () =>
	new File(
		[
			await sharp({ create: { width: 800, height: 600, channels: 3, background: '#336699' } })
				.jpeg()
				.toBuffer()
		],
		'me.jpg',
		{ type: 'image/jpeg' }
	);

beforeEach(async () => {
	await resetDb();
	await db.insert(profile).values(profileSeed); // photoUrl: '/profile.jpg'
});

describe('photo actions', () => {
	it.each([
		['uploadPhoto', async () => actions.uploadPhoto(post({ photo: await photoFile() }, user('9')))],
		[
			'setPhotoUrl',
			async () => actions.setPhotoUrl(post({ photoUrl: 'https://x.y/p.jpg' }, user('9')))
		],
		['removePhoto', async () => actions.removePhoto(post({}, user('9')))]
	])('%s is a 403 for anyone but the admin', async (_, run) => {
		await expect(run()).rejects.toSatisfy((e: unknown) => isHttpError(e, 403));
		expect((await getProfile())?.photoUrl).toBe('/profile.jpg');
	});

	it('uploads: stores a 256×256 version and points the profile at it', async () => {
		expect(await actions.uploadPhoto(post({ photo: await photoFile() }))).toEqual({
			photoMessage: 'Photo uploaded.'
		});
		expect((await getProfile())?.photoUrl).toMatch(/^\/photo\?v=/);
		const meta = await sharp((await getPhoto())!.data).metadata();
		expect([meta.width, meta.height]).toEqual([256, 256]);
	});

	it('refuses a missing file or one that is not an image, storing nothing', async () => {
		expect(await actions.uploadPhoto(post({}))).toMatchObject({ status: 400 });
		const text = new File(['hello'], 'notes.txt', { type: 'text/plain' });
		expect(await actions.uploadPhoto(post({ photo: text }))).toMatchObject({
			status: 400,
			data: { photoError: expect.stringContaining('not an image') }
		});
		expect(await getPhoto()).toBeNull();
		expect((await getProfile())?.photoUrl).toBe('/profile.jpg');
	});

	it('links an https image URL as-is', async () => {
		const url = 'https://www.mellowtech.org/api/thumbs/2c2b5f00.jpg';
		expect(await actions.setPhotoUrl(post({ photoUrl: url }))).toEqual({
			photoMessage: 'Photo URL saved.'
		});
		expect((await getProfile())?.photoUrl).toBe(url);
	});

	it.each([
		'http://example.com/p.jpg',
		'javascript:alert(1)',
		'data:image/png;base64,xx',
		'//evil.example/p.jpg',
		''
	])('refuses the URL %j and keeps what was typed', async (url) => {
		expect(await actions.setPhotoUrl(post({ photoUrl: url }))).toMatchObject({
			status: 400,
			data: { photoUrlValue: url }
		});
		expect((await getProfile())?.photoUrl).toBe('/profile.jpg');
	});

	it('removes the photo', async () => {
		await actions.removePhoto(post({}));
		expect((await getProfile())?.photoUrl).toBeNull();
	});
});
