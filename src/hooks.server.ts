import { sequence } from '@sveltejs/kit/hooks';
import { authHandle } from '$lib/server/auth';
import { adminGuard, privateForAdmin } from '$lib/server/auth/admin';
import { langHandle } from '$lib/server/lang';

// Language first (every page needs it), then the session, then the /admin gate that uses it,
// then the cache header for everything sent to the admin.
export const handle = sequence(langHandle, authHandle, adminGuard, privateForAdmin);
