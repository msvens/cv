import { requireAdmin } from '$lib/server/auth/admin';
import type { LayoutServerLoad } from './$types';

// The hook's adminGuard already redirects; this keeps the admin pages safe on their own.
export const load: LayoutServerLoad = (event) => {
	requireAdmin(event);
};
