import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// The admin opens on the applications (sign-in lands here too).
export const load: PageServerLoad = () => redirect(303, '/admin/applications');
