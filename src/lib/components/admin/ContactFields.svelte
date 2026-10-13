<script lang="ts">
	import TextField from './TextField.svelte';

	/** A contact's editable fields: a stored row or a failed submission both fit. */
	interface Values {
		name?: string | null;
		role?: string | null;
		email?: string | null;
		phone?: string | null;
		note?: string | null;
	}

	// The fields of a contact form (the parent supplies the <form>). `idPrefix` keeps element ids
	// unique: the application page has the details form and one form per open contact.
	let {
		values = {},
		errors = {},
		idPrefix
	}: { values?: Values; errors?: Partial<Record<string, string[]>>; idPrefix: string } = $props();
</script>

<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
	<TextField
		label="Name"
		name="name"
		id="{idPrefix}-name"
		value={values.name}
		required
		errors={errors.name}
	/>
	<TextField label="Role" name="role" id="{idPrefix}-role" value={values.role} />
	<TextField
		label="Email"
		name="email"
		id="{idPrefix}-email"
		type="email"
		value={values.email}
		errors={errors.email}
	/>
	<TextField label="Phone" name="phone" id="{idPrefix}-phone" type="tel" value={values.phone} />
</div>
<div>
	<label
		for="{idPrefix}-note"
		class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Note</label
	>
	<textarea
		id="{idPrefix}-note"
		name="note"
		rows="2"
		class="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
		value={values.note ?? ''}></textarea>
</div>
