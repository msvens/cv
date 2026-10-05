import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { requireAdmin } from '$lib/server/auth/admin';
import type { RequestHandler } from './$types';

/** The admin nav's "Sign out" form posts here; back to the public site afterwards. */
export const POST: RequestHandler = async (event) => {
	requireAdmin(event);
	await auth.api.signOut({ headers: event.request.headers });
	redirect(303, '/');
};
