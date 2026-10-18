import { error } from '@sveltejs/kit';
import { checkbox, positiveInt, text } from '$lib/server/forms';

/** The `[id]` route param as an application id; anything else is a 404. */
export function applicationId(param: string): number {
	const id = Number(param);
	if (!Number.isInteger(id) || id <= 0) error(404, 'No such application');
	return id;
}

/** The application details form's fields (the detail page's `update`). */
export function applicationValues(form: FormData) {
	return {
		company: text(form, 'company'),
		role: text(form, 'role'),
		adUrl: text(form, 'adUrl'),
		location: text(form, 'location'),
		deadline: text(form, 'deadline'),
		appliedOn: text(form, 'appliedOn'),
		notes: text(form, 'notes'),
		adText: text(form, 'adText')
	};
}

/** A contact form's fields (add and edit on the application page). */
export function contactValues(form: FormData) {
	return {
		name: text(form, 'name'),
		role: text(form, 'role'),
		email: text(form, 'email'),
		phone: text(form, 'phone'),
		note: text(form, 'note')
	};
}

/** The letter page's form. The recipient select sends '' for "the company only". */
export function letterValues(form: FormData) {
	return {
		language: text(form, 'language'),
		body: text(form, 'body'),
		includeContact: checkbox(form, 'includeContact'),
		includeRecipient: checkbox(form, 'includeRecipient'),
		recipientContactId: positiveInt(form, 'recipientContactId')
	};
}
