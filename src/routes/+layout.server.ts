import { getProfile } from '$lib/server/services/profile';
import type { LayoutServerLoad } from './$types';

// The profile is loaded here because the shell (TopBar, Footer) needs it on every page;
// pages read it from the merged layout data instead of querying it again.
export const load: LayoutServerLoad = async ({ locals }) => ({
	lang: locals.lang,
	profile: await getProfile()
});
