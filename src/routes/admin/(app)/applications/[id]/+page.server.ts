import { error, fail, redirect } from '@sveltejs/kit';
import { ownerToday } from '$lib/dates';
import { applicationValues } from '$lib/server/applicationForms';
import { requireAdmin } from '$lib/server/auth/admin';
import { invalid, text } from '$lib/server/forms';
import {
	changeStatus,
	deleteApplication,
	getApplication,
	listStatusChanges,
	updateApplication
} from '$lib/server/services/applications';
import { applicationSchema, statusSchema } from '$lib/validation/schemas';
import type { Actions, PageServerLoad } from './$types';

function applicationId(param: string): number {
	const id = Number(param);
	if (!Number.isInteger(id) || id <= 0) error(404, 'No such application');
	return id;
}

export const load: PageServerLoad = async ({ params }) => {
	const id = applicationId(params.id);
	const application = await getApplication(id);
	if (!application) error(404, 'No such application');
	return { application, timeline: await listStatusChanges(id) };
};

// Success returns { message }; a failure that isn't a field error returns { error }.
const gone = () => fail(404, { error: 'That application no longer exists.' });

export const actions: Actions = {
	update: async (event) => {
		requireAdmin(event);
		const id = applicationId(event.params.id);
		const values = applicationValues(await event.request.formData());
		const parsed = applicationSchema.safeParse(values);
		if (!parsed.success) return invalid(values, parsed.error);
		if ((await updateApplication(id, parsed.data)) === 'not-found') return gone();
		return { message: 'Application saved.' };
	},

	changeStatus: async (event) => {
		requireAdmin(event);
		const id = applicationId(event.params.id);
		const parsed = statusSchema.safeParse(text(await event.request.formData(), 'status'));
		if (!parsed.success) return fail(400, { error: 'Unknown status.' });
		if ((await changeStatus(id, parsed.data, ownerToday())) === 'not-found') return gone();
		return { message: 'Status changed.' };
	},

	delete: async (event) => {
		requireAdmin(event);
		const id = applicationId(event.params.id);
		if ((await deleteApplication(id)) === 'not-found') return gone();
		redirect(303, '/admin/applications');
	}
};
