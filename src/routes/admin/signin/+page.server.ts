import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { isAdmin } from '$lib/server/auth/admin';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
	if (isAdmin(locals.user)) redirect(303, '/admin');
	// Better Auth redirects back here with ?error=… when sign-in is refused.
	return { denied: url.searchParams.has('error') };
};

export const actions: Actions = {
	// Starts the GitHub OAuth flow server-side (no client auth library): Better Auth sets the
	// state cookie via the sveltekitCookies plugin and returns GitHub's authorize URL.
	default: async ({ request }) => {
		const { url } = await auth.api.signInSocial({
			body: { provider: 'github', callbackURL: '/admin', errorCallbackURL: '/admin/signin' },
			headers: request.headers
		});
		if (!url) throw new Error('Better Auth returned no GitHub authorize URL');
		redirect(303, url);
	}
};
