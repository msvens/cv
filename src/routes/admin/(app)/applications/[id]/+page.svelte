<script lang="ts">
	import { enhance } from '$app/forms';
	import { STATUSES, STATUS_LABELS, statusLabel } from '$lib/applications';
	import DeleteButton from '$lib/components/admin/DeleteButton.svelte';
	import FormMessage from '$lib/components/admin/FormMessage.svelte';
	import MarkdownEditor from '$lib/components/admin/MarkdownEditor.svelte';
	import SubmitButton from '$lib/components/admin/SubmitButton.svelte';
	import TextField from '$lib/components/admin/TextField.svelte';
	import { formatDay } from '$lib/dates';
	import { safeHref } from '$lib/markdown';

	let { data, form } = $props();

	const a = $derived(data.application);
	// After a failed save, show what was submitted (with the errors); otherwise the stored values.
	const v = $derived(form && 'values' in form && form.values ? form.values : a);
	const errors: Partial<Record<string, string[]>> = $derived(
		(form && 'errors' in form && form.errors) || {}
	);
	const adHref = $derived(a.adUrl ? safeHref(a.adUrl) : null);

	let saving = $state(false);
	let changing = $state(false);

	const box = 'max-w-3xl space-y-4 rounded border border-neutral-200 p-4 dark:border-neutral-800';
	const heading = 'font-medium text-neutral-900 dark:text-neutral-100';
	const field =
		'w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100';
	const label = 'mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300';
</script>

<a href="/admin/applications" class="text-sm text-neutral-500 hover:text-neutral-700"
	>← Applications</a
>
<h1 class="mt-2 mb-6 text-2xl font-light text-neutral-900 dark:text-neutral-100">
	{a.company} · {a.role}
</h1>

<div class="space-y-8">
	{#if form && 'message' in form && form.message}
		<FormMessage kind="success" text={form.message} />
	{:else if form && 'error' in form && form.error}
		<FormMessage kind="error" text={form.error} />
	{/if}

	<section class={box} aria-labelledby="status-heading">
		<h2 id="status-heading" class={heading}>Status</h2>
		<form
			method="POST"
			action="?/changeStatus"
			class="flex flex-wrap items-center gap-2"
			use:enhance={() => {
				changing = true;
				return async ({ update }) => {
					await update({ reset: false });
					changing = false;
				};
			}}
		>
			<label for="status" class="sr-only">Status</label>
			<select id="status" name="status" value={a.status} class="{field} w-auto">
				{#each STATUSES as status (status)}
					<option value={status}>{STATUS_LABELS[status]}</option>
				{/each}
			</select>
			<SubmitButton pending={changing} label="Change status" />
		</form>
		<ol class="space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
			{#each data.timeline as change (change.id)}
				<li>{statusLabel(change.status)} · {formatDay(change.changedAt)}</li>
			{/each}
		</ol>
	</section>

	<form
		method="POST"
		action="?/update"
		class={box}
		use:enhance={() => {
			saving = true;
			return async ({ update }) => {
				await update({ reset: false });
				saving = false;
			};
		}}
	>
		<h2 class={heading}>Details</h2>
		{#if form && 'errors' in form}
			<FormMessage kind="error" text="Please fix the fields marked below." />
		{/if}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<TextField
				label="Company"
				name="company"
				value={v.company}
				required
				errors={errors.company}
			/>
			<TextField label="Role" name="role" value={v.role} required errors={errors.role} />
			<TextField label="Location" name="location" value={v.location} errors={errors.location} />
			<TextField
				label="Link to the ad"
				name="adUrl"
				value={v.adUrl}
				placeholder="https://…"
				errors={errors.adUrl}
			/>
			<TextField
				label="Deadline"
				name="deadline"
				type="date"
				value={v.deadline}
				errors={errors.deadline}
			/>
			<TextField
				label="Applied"
				name="appliedOn"
				type="date"
				value={v.appliedOn}
				hint="Filled in when the status changes to Applied."
				errors={errors.appliedOn}
			/>
		</div>
		{#if adHref}
			<a href={adHref} target="_blank" rel="noopener noreferrer" class="text-sm underline"
				>Open the ad</a
			>
		{/if}
		<MarkdownEditor name="notes" value={v.notes ?? ''} label="Notes (Markdown)" />
		<div>
			<label for="adText" class={label}>The job ad</label>
			<textarea
				id="adText"
				name="adText"
				rows="10"
				class={field}
				placeholder="Paste the ad's text, so it's kept after the ad is taken down."
				value={v.adText ?? ''}></textarea>
		</div>
		<SubmitButton pending={saving} />
	</form>

	<section class="max-w-3xl">
		<DeleteButton
			action="?/delete"
			id={a.id}
			label="Delete application"
			confirmText="Delete “{a.company} · {a.role}” and its timeline?"
		/>
	</section>
</div>
