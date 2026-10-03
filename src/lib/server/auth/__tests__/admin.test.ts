import { isHttpError, isRedirect } from '@sveltejs/kit';
import { describe, expect, it, vi } from 'vitest';
import { fakeEvent } from '$lib/server/testing/fakeEvent';
import {
	adminGuard,
	allowAccountCreation,
	allowUserCreation,
	githubFields,
	isAdmin,
	isAdminGithubId,
	requireAdmin
} from '../admin';

vi.mock('$app/env/private', () => ({ ADMIN_GITHUB_ID: '12345' }));

type User = NonNullable<App.Locals['user']>;

/** A signed-in user as Better Auth puts it on `locals`, with the given GitHub ID. */
const user = (githubId: string): User => ({
	id: `user-${githubId}`,
	name: 'Someone',
	email: `${githubId}@example.com`,
	emailVerified: true,
	image: null,
	createdAt: new Date(),
	updatedAt: new Date(),
	githubId,
	githubLogin: `login-${githubId}`
});
const admin = user('12345');
const someoneElse = user('999');

/** Runs `fn` and returns what it threw (SvelteKit's redirect/error throw synchronously). */
function thrown(fn: () => unknown): unknown {
	try {
		fn();
	} catch (e) {
		return e;
	}
	throw new Error('expected a throw');
}

describe('isAdminGithubId / isAdmin', () => {
	it('accepts only the admin GitHub ID', () => {
		expect(isAdminGithubId('12345')).toBe(true);
		expect(isAdmin(admin)).toBe(true);
	});

	it.each(['999', '', null, undefined])('rejects %j', (id) => {
		expect(isAdminGithubId(id)).toBe(false);
	});

	it('rejects a missing or ID-less user', () => {
		expect(isAdmin(null)).toBe(false);
		expect(isAdmin({ githubId: null })).toBe(false);
		expect(isAdmin(someoneElse)).toBe(false);
	});
});

describe('sign-in rules (Better Auth create.before hooks)', () => {
	it('lets only the admin become a user', () => {
		expect(allowUserCreation(admin)).toBe(true);
		expect(allowUserCreation(someoneElse)).toBe(false);
		// The GitHub ID never arrived (as when the fields were filtered out): refuse, don't guess.
		expect(allowUserCreation({ name: 'unknown' })).toBe(false);
	});

	it('lets only the admin GitHub account be recorded', () => {
		expect(allowAccountCreation({ providerId: 'github', accountId: '12345' })).toBe(true);
		expect(allowAccountCreation({ providerId: 'github', accountId: '999' })).toBe(false);
		expect(allowAccountCreation({ providerId: 'google', accountId: '12345' })).toBe(false);
	});

	it('reads the GitHub fields defensively', () => {
		expect(githubFields({ githubId: '1', githubLogin: 'me' })).toEqual({
			githubId: '1',
			githubLogin: 'me'
		});
		expect(githubFields({ githubId: 1 })).toEqual({ githubId: undefined, githubLogin: undefined });
		expect(githubFields(undefined).githubId).toBeUndefined();
	});
});

describe('requireAdmin', () => {
	it('passes the admin', () => {
		expect(() => requireAdmin(fakeEvent({ locals: { user: admin } }))).not.toThrow();
	});

	it.each([
		['someone else', someoneElse],
		['nobody', null]
	])('is a 403 for %s', (_, u) => {
		expect(
			isHttpError(
				thrown(() => requireAdmin(fakeEvent({ locals: { user: u } }))),
				403
			)
		).toBe(true);
	});
});

describe('adminGuard', () => {
	const resolve = async () => new Response('ok');
	const run = (path: string, u: User | null = null) =>
		adminGuard({
			event: fakeEvent({ url: `http://localhost${path}`, locals: { user: u } }),
			resolve
		});

	it.each(['/admin', '/admin/sections', '/admin/sections/3'])(
		'sends a visitor from %s to the sign-in page',
		(path) => {
			const e = thrown(() => run(path));
			expect(isRedirect(e)).toBe(true);
			expect(e).toMatchObject({ status: 303, location: '/admin/signin' });
		}
	);

	it('also turns away a signed-in non-admin', () => {
		expect(thrown(() => run('/admin', someoneElse))).toMatchObject({ status: 303 });
	});

	it('lets the admin through', async () => {
		expect((await run('/admin/sections', admin)).status).toBe(200);
	});

	it.each(['/admin/signin', '/', '/api/pdf', '/administrator'])('never guards %s', async (path) => {
		expect((await run(path)).status).toBe(200);
	});
});
