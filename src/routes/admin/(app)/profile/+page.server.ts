import { fail } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth/admin';
import { checkbox, invalid, text } from '$lib/server/forms';
import { processPhoto } from '$lib/server/photo';
import { removePhoto, savePhoto, setPhotoUrl } from '$lib/server/services/photo';
import { updateProfile } from '$lib/server/services/profile';
import { photoUrlSchema, profileSchema } from '$lib/validation/schemas';
import type { Actions } from './$types';

// The profile itself comes from the root layout's load (data.profile). The photo has its own
// actions (named, so the profile form's is `save` rather than `default`); their results use
// photoMessage / photoError so they never mix with the profile form's values and errors.
const photoProblem = (photoError: string, photoUrlValue?: string) =>
	fail(400, { photoError, photoUrlValue });

export const actions: Actions = {
	save: async (event) => {
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
	},

	uploadPhoto: async (event) => {
		requireAdmin(event);
		const file = (await event.request.formData()).get('photo');
		if (!(file instanceof File) || file.size === 0)
			return photoProblem('Choose an image to upload.');
		const photo = await processPhoto(new Uint8Array(await file.arrayBuffer()));
		if (photo === 'too-large') return photoProblem('That file is larger than 10 MB.');
		if (photo === 'not-an-image')
			return photoProblem('That file is not an image that can be read.');
		await savePhoto(photo);
		return { photoMessage: 'Photo uploaded.' };
	},

	setPhotoUrl: async (event) => {
		requireAdmin(event);
		const url = text(await event.request.formData(), 'photoUrl');
		const parsed = photoUrlSchema.safeParse(url);
		if (!parsed.success) return photoProblem(parsed.error.issues[0].message, url);
		await setPhotoUrl(parsed.data);
		return { photoMessage: 'Photo URL saved.' };
	},

	removePhoto: async (event) => {
		requireAdmin(event);
		await removePhoto();
		return { photoMessage: 'Photo removed.' };
	}
};
