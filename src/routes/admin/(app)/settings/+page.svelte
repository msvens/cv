<script lang="ts">
	import { enhance } from '$app/forms';
	import FormMessage from '$lib/components/admin/FormMessage.svelte';
	import SubmitButton from '$lib/components/admin/SubmitButton.svelte';
	import TextField from '$lib/components/admin/TextField.svelte';

	let { data, form } = $props();

	// After a failed save, show what was submitted (with the errors); otherwise the stored values.
	const v = $derived(
		form && 'values' in form && form.values
			? form.values
			: { attentionDays: String(data.settings.attentionDays) }
	);
	const errors: Partial<Record<string, string[]>> = $derived(
		(form && 'errors' in form && form.errors) || {}
	);
	let pending = $state(false);
</script>

<h1 class="mb-6 text-2xl font-light text-neutral-900 dark:text-neutral-100">Settings</h1>

<form
	method="POST"
	action="?/save"
	class="max-w-xl space-y-6"
	use:enhance={() => {
		pending = true;
		return async ({ update }) => {
			await update({ reset: false });
			pending = false;
		};
	}}
>
	{#if form && 'message' in form && form.message}
		<FormMessage kind="success" text={form.message} />
	{:else if form && 'errors' in form}
		<FormMessage kind="error" text="Please fix the fields marked below." />
	{/if}

	<TextField
		label="Attention window (days)"
		name="attentionDays"
		type="number"
		value={v.attentionDays}
		hint="Applications not yet applied for show up this many days before their deadline."
		errors={errors.attentionDays}
	/>

	<SubmitButton {pending} />
</form>
