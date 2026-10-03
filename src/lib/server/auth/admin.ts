import { error, redirect, type Handle, type RequestEvent } from '@sveltejs/kit';
import { ADMIN_GITHUB_ID } from '$app/env/private';

/**
 * The one admin: the GitHub account whose numeric ID is ADMIN_GITHUB_ID. Compared by ID, not
 * login, because a GitHub username can be changed (and then reused by someone else).
 */
export function isAdminGithubId(githubId: string | null | undefined): boolean {
	return !!githubId && githubId === ADMIN_GITHUB_ID;
}

/**
 * The GitHub fields `mapProfileToUser` adds. Better Auth types hook arguments as its base user,
 * without additional fields, so read them defensively instead of casting.
 */
export function githubFields(user: object | null | undefined) {
	const field = (key: 'githubId' | 'githubLogin') => {
		const value: unknown = user ? Reflect.get(user, key) : undefined;
		return typeof value === 'string' ? value : undefined;
	};
	return { githubId: field('githubId'), githubLogin: field('githubLogin') };
}

/**
 * Sign-in rules for Better Auth's `create.before` database hooks: only the admin gets a user or
 * a GitHub account record, so sign-in fails for anyone else. `false` blocks the creation; any
 * other return lets it through unchanged.
 */
export function allowUserCreation(user: object): boolean {
	return isAdminGithubId(githubFields(user).githubId);
}

export function allowAccountCreation(account: { providerId: string; accountId: string }): boolean {
	return account.providerId === 'github' && isAdminGithubId(account.accountId);
}

export function isAdmin(user: { githubId?: string | null } | null | undefined): boolean {
	return isAdminGithubId(user?.githubId);
}

/**
 * Every admin form action calls this first. Actions are POST endpoints, so they must not rely
 * on the page-level guard alone.
 */
export function requireAdmin(event: Pick<RequestEvent, 'locals'>): void {
	if (!isAdmin(event.locals.user)) error(403, 'Forbidden');
}

export const SIGN_IN_PATH = '/admin/signin';

/** Sends anyone but the admin from `/admin/**` to the sign-in page. */
export const adminGuard: Handle = ({ event, resolve }) => {
	const path = event.url.pathname;
	const isAdminArea = path === '/admin' || path.startsWith('/admin/');
	if (isAdminArea && path !== SIGN_IN_PATH && !isAdmin(event.locals.user)) {
		redirect(303, SIGN_IN_PATH);
	}
	return resolve(event);
};
