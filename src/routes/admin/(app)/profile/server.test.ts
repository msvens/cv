import { isHttpError } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { profileSeed } from '$lib/server/db/seed-data';
import { profile } from '$lib/server/db/schema';
import { getProfile } from '$lib/server/services/profile';
import { fakeEvent } from '$lib/server/testing/fakeEvent';
import { db, resetDb } from '$lib/server/testing/testDb';
import { actions } from './+page.server';

vi.mock('$lib/server/db/client', () => import('$lib/server/testing/testDb'));
vi.mock('$app/env/private', () => ({ ADMIN_GITHUB_ID: '12345' }));

const admin = {
	id: 'u1',
	name: 'Me',
	email: 'me@example.com',
	emailVerified: true,
	image: null,
	createdAt: new Date(),
	updatedAt: new Date(),
	githubId: '12345',
	githubLogin: 'msvens'
};

/** A valid profile form, as the browser would submit it (checked boxes send "on"). */
const validForm = {
	name: 'Martin Svensson',
	titleEn: 'Engineering Director',
	titleSv: 'Engineering Director',
	email: 'msvens@gmail.com',
	phone: '',
	locationEn: 'Stockholm, Sweden',
	locationSv: 'Stockholm, Sverige',
	github: 'msvens',
	linkedin: 'msvens',
	photoUrl: '/someone-elses.jpg', // not a profile-form field any more: must be ignored
	available: 'on',
	showLinkedin: 'on', // showGithub left unchecked
	bioEn: 'Bio',
	bioSv: 'Bio'
};

const save = (form: Record<string, string>, user: typeof admin | null = admin) =>
	actions.save(fakeEvent({ url: 'http://localhost/admin/profile', locals: { user }, form }));

beforeEach(async () => {
	await resetDb();
	await db.insert(profile).values(profileSeed);
});

describe('profile form action', () => {
	it('saves a valid form, including unchecked boxes as false', async () => {
		expect(await save(validForm)).toEqual({ saved: true });
		expect(await getProfile()).toMatchObject({
			linkedin: 'msvens',
			phone: null,
			showGithub: false,
			showLinkedin: true
		});
	});

	it('refuses anyone but the admin', async () => {
		try {
			await save(validForm, { ...admin, githubId: '999' });
			expect.unreachable();
		} catch (e) {
			expect(isHttpError(e, 403)).toBe(true);
		}
		expect((await getProfile())?.linkedin).toBeNull(); // nothing saved
	});

	it('returns field errors and keeps what was typed', async () => {
		const result = await save({
			...validForm,
			email: 'not-an-email',
			linkedin: 'https://linkedin.com/in/msvens'
		});
		expect(result).toMatchObject({
			status: 400,
			data: {
				values: { email: 'not-an-email', linkedin: 'https://linkedin.com/in/msvens' },
				errors: { email: expect.any(Array), linkedin: expect.any(Array) }
			}
		});
		expect((await getProfile())?.email).toBe(profileSeed.email); // nothing saved
	});

	it('leaves the photo alone: it has its own actions', async () => {
		await db.update(profile).set({ photoUrl: '/photo?v=abc123' });
		expect(await save(validForm)).toEqual({ saved: true });
		expect((await getProfile())?.photoUrl).toBe('/photo?v=abc123');
	});
});
