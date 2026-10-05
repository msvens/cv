import { error, fail } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth/admin';
import { invalid, positiveInt } from '$lib/server/forms';
import { direction, itemValues, sectionValues, slugTaken } from '$lib/server/sectionForms';
import {
	createItem,
	deleteItem,
	getSection,
	listItemsBySection,
	moveItem,
	updateItem,
	updateSection
} from '$lib/server/services/sections';
import { sectionItemSchema, sectionSchema } from '$lib/validation/schemas';
import type { Actions, PageServerLoad } from './$types';

function sectionId(param: string): number {
	const id = Number(param);
	if (!Number.isInteger(id) || id <= 0) error(404, 'No such section');
	return id;
}

export const load: PageServerLoad = async ({ params }) => {
	const id = sectionId(params.id);
	const section = await getSection(id);
	if (!section) error(404, 'No such section');
	return { section, items: await listItemsBySection(id) };
};

// Success returns { message }; a failure that isn't a field error returns { error }. Field
// errors carry `target` ('section', 'new-item' or the item's id) so the page reopens that form.
const gone = (what: string) => fail(404, { error: `That ${what} no longer exists.` });

export const actions: Actions = {
	update: async (event) => {
		requireAdmin(event);
		const id = sectionId(event.params.id);
		const values = sectionValues(await event.request.formData());
		const parsed = sectionSchema.safeParse(values);
		if (!parsed.success) return invalid(values, parsed.error, 'section');
		const result = await updateSection(id, parsed.data);
		if (result === 'slug-taken') return slugTaken(values, 'section');
		if (result === 'not-found') return gone('section');
		return { message: 'Section saved.' };
	},

	createItem: async (event) => {
		requireAdmin(event);
		const id = sectionId(event.params.id);
		const values = itemValues(await event.request.formData());
		const parsed = sectionItemSchema.safeParse(values);
		if (!parsed.success) return invalid(values, parsed.error, 'new-item');
		if ((await createItem(id, parsed.data)) === 'not-found') return gone('section');
		return { message: 'Item added.' };
	},

	updateItem: async (event) => {
		requireAdmin(event);
		const id = sectionId(event.params.id);
		const form = await event.request.formData();
		const itemId = positiveInt(form, 'id');
		if (!itemId) return gone('item');
		const values = itemValues(form);
		const parsed = sectionItemSchema.safeParse(values);
		if (!parsed.success) return invalid(values, parsed.error, String(itemId));
		if ((await updateItem(id, itemId, parsed.data)) === 'not-found') return gone('item');
		return { message: 'Item saved.' };
	},

	deleteItem: async (event) => {
		requireAdmin(event);
		const id = sectionId(event.params.id);
		const itemId = positiveInt(await event.request.formData(), 'id');
		if (!itemId || (await deleteItem(id, itemId)) === 'not-found') return gone('item');
		return { message: 'Item deleted.' };
	},

	moveItem: async (event) => {
		requireAdmin(event);
		const id = sectionId(event.params.id);
		const form = await event.request.formData();
		const itemId = positiveInt(form, 'id');
		const dir = direction(form);
		if (!itemId || !dir) return fail(400, { error: 'Invalid move.' });
		if ((await moveItem(id, itemId, dir)) === 'not-found') return gone('item');
		return {};
	}
};
