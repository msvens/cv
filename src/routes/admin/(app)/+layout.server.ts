import { requireAdmin } from '$lib/server/auth/admin';
import type { LayoutServerLoad } from './$types';

// The hook's adminGuard already redirects; this keeps the admin pages safe on their own. The
// nav's attention count comes from the root layout's load, which reruns after every enhanced
// form submit, so it stays current.
export const load: LayoutServerLoad = (event) => {
	requireAdmin(event);
};
