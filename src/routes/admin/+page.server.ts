import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// The admin opens on the profile, as in the old app.
export const load: PageServerLoad = () => redirect(303, '/admin/profile');
