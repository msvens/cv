import { error, fail, redirect } from '@sveltejs/kit';
import { attention } from '$lib/applications';
import { ownerToday } from '$lib/dates';
import { applicationValues, contactValues } from '$lib/server/applicationForms';
import { requireAdmin } from '$lib/server/auth/admin';
import { invalid, positiveInt, text } from '$lib/server/forms';
import {
	addContact,
	changeStatus,
	deleteApplication,
	deleteContact,
	getApplication,
	listContacts,
	listStatusChanges,
	updateApplication,
	updateContact
} from '$lib/server/services/applications';
import { getSettings } from '$lib/server/services/settings';
import { applicationSchema, contactSchema, statusSchema } from '$lib/validation/schemas';
import type { Actions, PageServerLoad } from './$types';

function applicationId(param: string): number {
	const id = Number(param);
	if (!Number.isInteger(id) || id <= 0) error(404, 'No such application');
	return id;
}

export const load: PageServerLoad = async ({ params }) => {
	const id = applicationId(params.id);
	const [application, timeline, contacts, { attentionDays }] = await Promise.all([
		getApplication(id),
		listStatusChanges(id),
		listContacts(id),
		getSettings()
	]);
	if (!application) error(404, 'No such application');
	// Same rule as the list and the front-page notice, so they never disagree.
	return {
		application,
		timeline,
		contacts,
		attention: attention(application, ownerToday(), attentionDays)
	};
};

// Success returns { message }; a failure that isn't a field error returns { error }. A contact's
// field errors carry `target` ('new-contact' or the contact's id) so the page reopens that form.
const gone = (what = 'application') => fail(404, { error: `That ${what} no longer exists.` });

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
	},

	addContact: async (event) => {
		requireAdmin(event);
		const id = applicationId(event.params.id);
		const values = contactValues(await event.request.formData());
		const parsed = contactSchema.safeParse(values);
		if (!parsed.success) return invalid(values, parsed.error, 'new-contact');
		if ((await addContact(id, parsed.data)) === 'not-found') return gone();
		return { message: 'Contact added.' };
	},

	updateContact: async (event) => {
		requireAdmin(event);
		const id = applicationId(event.params.id);
		const form = await event.request.formData();
		const contactId = positiveInt(form, 'id');
		if (!contactId) return gone('contact');
		const values = contactValues(form);
		const parsed = contactSchema.safeParse(values);
		if (!parsed.success) return invalid(values, parsed.error, String(contactId));
		if ((await updateContact(id, contactId, parsed.data)) === 'not-found') return gone('contact');
		return { message: 'Contact saved.' };
	},

	deleteContact: async (event) => {
		requireAdmin(event);
		const id = applicationId(event.params.id);
		const contactId = positiveInt(await event.request.formData(), 'id');
		if (!contactId || (await deleteContact(id, contactId)) === 'not-found') return gone('contact');
		return { message: 'Contact deleted.' };
	}
};
