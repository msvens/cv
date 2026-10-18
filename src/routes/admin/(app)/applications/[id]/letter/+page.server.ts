import { error, fail, redirect } from '@sveltejs/kit';
import { applicationId, letterValues } from '$lib/server/applicationForms';
import { requireAdmin } from '$lib/server/auth/admin';
import { invalid, positiveInt } from '$lib/server/forms';
import { getApplication, listContacts } from '$lib/server/services/applications';
import {
	copyLetter,
	deleteLetter,
	getLetter,
	listLetterSources,
	saveLetter
} from '$lib/server/services/letters';
import { letterSchema } from '$lib/validation/schemas';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const id = applicationId(params.id);
	const [application, contacts, letter] = await Promise.all([
		getApplication(id),
		listContacts(id),
		getLetter(id)
	]);
	if (!application) error(404, 'No such application');
	// Something to start from only matters while there is no letter yet.
	return { application, contacts, letter, sources: letter ? [] : await listLetterSources(id) };
};

const gone = (what = 'application') => fail(404, { error: `That ${what} no longer exists.` });

export const actions: Actions = {
	save: async (event) => {
		requireAdmin(event);
		const id = applicationId(event.params.id);
		const values = letterValues(await event.request.formData());
		const parsed = letterSchema.safeParse(values);
		if (!parsed.success) return invalid(values, parsed.error);
		const result = await saveLetter(id, parsed.data);
		if (result === 'not-found') return gone();
		if (result === 'bad-contact') return gone('contact');
		return { message: 'Letter saved.' };
	},

	copy: async (event) => {
		requireAdmin(event);
		const id = applicationId(event.params.id);
		const from = positiveInt(await event.request.formData(), 'from');
		const result = from ? await copyLetter(id, from) : 'not-found';
		if (result === 'not-found') return gone('letter');
		if (result === 'exists') return fail(409, { error: 'This application already has a letter.' });
		return { message: 'Letter copied.' };
	},

	delete: async (event) => {
		requireAdmin(event);
		const id = applicationId(event.params.id);
		if ((await deleteLetter(id)) === 'not-found') return gone('letter');
		redirect(303, `/admin/applications/${id}`);
	}
};
