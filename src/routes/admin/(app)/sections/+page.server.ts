import { fail } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth/admin';
import { invalid, positiveInt } from '$lib/server/forms';
import { direction, sectionValues, slugTaken } from '$lib/server/sectionForms';
import {
	createSection,
	deleteSection,
	listSectionsWithCounts,
	moveSection
} from '$lib/server/services/sections';
import { sectionSchema } from '$lib/validation/schemas';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({ sections: await listSectionsWithCounts() });

// Success returns { message }; a failure that isn't a field error returns { error }.
const notFound = () => fail(404, { error: 'That section no longer exists.' });

export const actions: Actions = {
	create: async (event) => {
		requireAdmin(event);
		const values = sectionValues(await event.request.formData());
		const parsed = sectionSchema.safeParse(values);
		if (!parsed.success) return invalid(values, parsed.error);
		if ((await createSection(parsed.data)) === 'slug-taken') return slugTaken(values);
		return { message: `Section “${parsed.data.labelEn}” created.` };
	},

	delete: async (event) => {
		requireAdmin(event);
		const id = positiveInt(await event.request.formData(), 'id');
		if (!id || (await deleteSection(id)) === 'not-found') return notFound();
		return { message: 'Section deleted.' };
	},

	move: async (event) => {
		requireAdmin(event);
		const form = await event.request.formData();
		const id = positiveInt(form, 'id');
		const dir = direction(form);
		if (!id || !dir) return fail(400, { error: 'Invalid move.' });
		if ((await moveSection(id, dir)) === 'not-found') return notFound();
		return {};
	}
};
