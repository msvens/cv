import { fail } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth/admin';
import { checkbox, invalid, text } from '$lib/server/forms';
import { updateProfile } from '$lib/server/services/profile';
import { profileSchema } from '$lib/validation/schemas';
import type { Actions } from './$types';

// The profile itself comes from the root layout's load (data.profile).
export const actions: Actions = {
	default: async (event) => {
		requireAdmin(event);
		const form = await event.request.formData();
		const values = {
			name: text(form, 'name'),
			titleEn: text(form, 'titleEn'),
			titleSv: text(form, 'titleSv'),
			email: text(form, 'email'),
			phone: text(form, 'phone'),
			locationEn: text(form, 'locationEn'),
			locationSv: text(form, 'locationSv'),
			github: text(form, 'github'),
			linkedin: text(form, 'linkedin'),
			photoUrl: text(form, 'photoUrl'),
			available: checkbox(form, 'available'),
			showGithub: checkbox(form, 'showGithub'),
			showLinkedin: checkbox(form, 'showLinkedin'),
			bioEn: text(form, 'bioEn'),
			bioSv: text(form, 'bioSv')
		};
		const parsed = profileSchema.safeParse(values);
		if (!parsed.success) return invalid(values, parsed.error);
		if (!(await updateProfile(parsed.data))) {
			return fail(404, { values, message: 'There is no profile to update (run pnpm db:seed).' });
		}
		return { saved: true };
	}
};
