<script lang="ts">
	// `form` is the id of the form to submit, for a button placed outside it (the page header).
	let {
		pending = false,
		label = 'Save',
		form
	}: { pending?: boolean; label?: string; form?: string } = $props();
</script>

<button
	type="submit"
	{form}
	disabled={pending}
	class="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
>
	{pending ? 'Saving…' : label}
</button>
