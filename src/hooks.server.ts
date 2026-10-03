import { sequence } from '@sveltejs/kit/hooks';
import { authHandle } from '$lib/server/auth';
import { adminGuard } from '$lib/server/auth/admin';
import { langHandle } from '$lib/server/lang';

// Language first (every page needs it), then the session, then the /admin gate that uses it.
export const handle = sequence(langHandle, authHandle, adminGuard);
