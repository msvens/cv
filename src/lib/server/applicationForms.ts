import { text } from '$lib/server/forms';

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
