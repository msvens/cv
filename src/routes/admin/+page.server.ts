import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { requireAdmin } from '$lib/server/auth/admin';
import type { Actions, PageServerLoad } from './$types';

// Placeholder until the admin UI (Phase 6): proves the sign-in round trip.
export const load: PageServerLoad = ({ locals }) => ({
	login: locals.user?.githubLogin ?? null
});

export const actions: Actions = {
	signout: async (event) => {
		requireAdmin(event);
		await auth.api.signOut({ headers: event.request.headers });
		redirect(303, '/admin/signin');
	}
};
