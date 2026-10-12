import { isHttpError, type RequestEvent } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { settings } from '$lib/server/db/schema';
import { fakeEvent } from '$lib/server/testing/fakeEvent';
import { db, resetDb } from '$lib/server/testing/testDb';
import { load as layoutLoad } from '../+layout.server';
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
const admin = user('12345');
const stranger = user('999');

const save = (attentionDays: string, as = admin) =>
	actions.save(
		fakeEvent<RequestEvent & Parameters<typeof actions.save>[0]>({
			url: 'http://localhost/admin/settings',
			locals: { user: as },
			form: { attentionDays }
		})
	);

beforeEach(resetDb);

describe('settings action', () => {
	it('is a 403 for anyone but the admin', async () => {
		await expect(save('14', stranger)).rejects.toSatisfy((e: unknown) => isHttpError(e, 403));
		expect(await db.select().from(settings)).toHaveLength(0);
	});

	it('saves the attention window', async () => {
		expect(await save('14')).toEqual({ message: 'Settings saved.' });
		expect((await db.select().from(settings))[0].attentionDays).toBe(14);
	});

	it.each(['0', '91', '2.5', 'abc', ''])(
		'rejects %j as a field error, keeping it',
		async (value) => {
			expect(await save(value)).toMatchObject({
				status: 400,
				data: { values: { attentionDays: value }, errors: { attentionDays: [expect.any(String)] } }
			});
			expect(await db.select().from(settings)).toHaveLength(0);
		}
	);
});

// The attention count itself is the root layout's (src/routes/layout.server.test.ts).
describe('admin layout', () => {
	const load = (as: typeof admin) =>
		layoutLoad(fakeEvent<Parameters<typeof layoutLoad>[0]>({ locals: { user: as } }));

	it('is a 403 for anyone but the admin', () => {
		expect(() => load(stranger)).toThrow(expect.toSatisfy((e) => isHttpError(e, 403)));
		expect(() => load(admin)).not.toThrow();
	});
});
