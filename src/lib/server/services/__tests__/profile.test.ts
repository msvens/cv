import { describe, expect, it, vi } from 'vitest';
import { profileSeed } from '$lib/server/db/seed-data';
import { profile } from '$lib/server/db/schema';
import { db } from '$lib/server/testing/testDb';
import { getProfile } from '../profile';

vi.mock('$lib/server/db/client', () => import('$lib/server/testing/testDb'));

describe('getProfile', () => {
	it('returns null when there is no profile', async () => {
		expect(await getProfile()).toBeNull();
	});

	it('returns the profile row', async () => {
		await db.insert(profile).values(profileSeed);
		expect(await getProfile()).toMatchObject({ name: 'Martin Svensson', available: true });
	});
});
