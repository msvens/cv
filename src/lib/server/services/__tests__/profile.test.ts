import { beforeEach, describe, expect, it, vi } from 'vitest';
import { profileSeed } from '$lib/server/db/seed-data';
import { profile } from '$lib/server/db/schema';
import { db, resetDb } from '$lib/server/testing/testDb';
import { fillGithubIfEmpty, getProfile, updateProfile } from '../profile';
import type { ProfileInput } from '$lib/validation/schemas';

vi.mock('$lib/server/db/client', () => import('$lib/server/testing/testDb'));

beforeEach(resetDb);

describe('getProfile', () => {
	it('returns null when there is no profile', async () => {
		expect(await getProfile()).toBeNull();
	});

	it('returns the profile row', async () => {
		await db.insert(profile).values(profileSeed);
		expect(await getProfile()).toMatchObject({ name: 'Martin Svensson', available: true });
	});
});

describe('fillGithubIfEmpty', () => {
	const githubAfterFill = async (github: string | null) => {
		await db.insert(profile).values({ ...profileSeed, github });
		await fillGithubIfEmpty('msvens');
		return (await getProfile())?.github;
	};

	it.each([null, '', '   '])('fills an empty username (%j)', async (github) => {
		expect(await githubAfterFill(github)).toBe('msvens');
	});

	it('never overwrites an existing username', async () => {
		expect(await githubAfterFill('someone-else')).toBe('someone-else');
	});

	it('does not count as a content edit', async () => {
		const updatedAt = new Date('2026-01-01T00:00:00Z');
		await db.insert(profile).values({ ...profileSeed, github: null, updatedAt });
		await fillGithubIfEmpty('msvens');
		expect((await getProfile())?.updatedAt).toEqual(updatedAt);
	});
});

describe('updateProfile', () => {
	const input: ProfileInput = {
		name: 'Martin Svensson',
		titleEn: 'Director',
		titleSv: 'Chef',
		email: 'msvens@gmail.com',
		phone: '',
		locationEn: 'Stockholm',
		locationSv: 'Stockholm',
		github: 'msvens',
		linkedin: '',
		available: false,
		showGithub: false,
		showLinkedin: true,
		bioEn: 'Bio',
		bioSv: 'Bio'
	};

	it('reports that there is nothing to update without a profile', async () => {
		expect(await updateProfile(input)).toBe(false);
	});

	it('saves the form, storing blank optional fields as null', async () => {
		await db.insert(profile).values(profileSeed);
		expect(await updateProfile(input)).toBe(true);
		expect(await getProfile()).toMatchObject({
			titleEn: 'Director',
			phone: null,
			linkedin: null,
			available: false,
			showGithub: false,
			showLinkedin: true
		});
	});

	it('moves updatedAt, so the footer shows the edit', async () => {
		const before = new Date('2026-01-01T00:00:00Z');
		await db.insert(profile).values({ ...profileSeed, updatedAt: before });
		await updateProfile(input);
		expect((await getProfile())!.updatedAt.getTime()).toBeGreaterThan(before.getTime());
	});
});
