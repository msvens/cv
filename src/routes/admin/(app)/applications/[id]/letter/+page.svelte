<script lang="ts">
	import { enhance } from '$app/forms';
	import DeleteButton from '$lib/components/admin/DeleteButton.svelte';
	import FormMessage from '$lib/components/admin/FormMessage.svelte';
	import MarkdownEditor from '$lib/components/admin/MarkdownEditor.svelte';
	import PageHeader from '$lib/components/admin/PageHeader.svelte';
	import SubmitButton from '$lib/components/admin/SubmitButton.svelte';
	import { formatDay } from '$lib/dates';

	let { data, form } = $props();

	const a = $derived(data.application);
	const appHref = $derived(`/admin/applications/${a.id}`);
	// After a failed save, show what was submitted (with the errors); otherwise the stored letter.
	const failed = $derived(form && 'values' in form && form.values ? form.values : null);
	const v = $derived(
		failed ??
			data.letter ?? {
				language: 'en',
				body: '',
				includeContact: false,
				includeRecipient: false,
				recipientContactId: null
			}
	);
	const errors: Partial<Record<string, string[]>> = $derived(
		(form && 'errors' in form && form.errors) || {}
	);
	// Shows the recipient select while ticked; follows the stored value after each save.
	let includeRecipient = $derived(v.includeRecipient);

	let saving = $state(false);
	let copying = $state(false);

	const LANGUAGES = [
		{ value: 'en', label: 'English' },
		{ value: 'sv', label: 'Swedish' }
	];
	const box = 'max-w-3xl space-y-4 rounded border border-neutral-200 p-4 dark:border-neutral-800';
	const heading = 'font-medium text-neutral-900 dark:text-neutral-100';
	const field =
		'rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100';
	const option = 'flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300';
</script>

<PageHeader
	title="Letter"
	subtitle="{a.company} · {a.role}"
	back={{ href: appHref, label: a.company }}
>
	{#snippet actions()}
		{#if data.letter}
			<a
				href="{appHref}/letter.pdf"
				target="_blank"
				class="text-sm text-neutral-600 underline hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
				>View PDF</a
			>
		{/if}
		<SubmitButton form="letter" pending={saving} />
		{#if data.letter}
			<span class="h-6 w-px bg-neutral-200 dark:bg-neutral-800" aria-hidden="true"></span>
			<DeleteButton action="?/delete" label="Delete letter" confirmText="Delete this letter?" />
		{/if}
	{/snippet}
</PageHeader>

<div class="space-y-8">
	{#if form && 'error' in form && form.error}
		<FormMessage text={form.error} />
	{/if}

	{#if data.letter}
		<p class="text-sm text-neutral-500">
			Saved {formatDay(data.letter.updatedAt)}. The PDF shows the saved letter: save first to see
			your changes in it.
		</p>
	{:else if data.sources.length > 0}
		<form
			method="POST"
			action="?/copy"
			class={box}
			use:enhance={() => {
				copying = true;
				return async ({ update }) => {
					await update();
					copying = false;
				};
			}}
		>
			<h2 class={heading}>Start from an earlier letter</h2>
			<div class="flex flex-wrap items-center gap-2">
				<label for="from" class="sr-only">Earlier letter</label>
				<select id="from" name="from" class={field}>
					{#each data.sources as source (source.applicationId)}
						<option value={source.applicationId}>
							{source.company} · {source.role} ({source.language === 'sv' ? 'Swedish' : 'English'},
							{formatDay(source.updatedAt)})
						</option>
					{/each}
				</select>
				<SubmitButton pending={copying} label="Copy" />
			</div>
			<p class="text-sm text-neutral-500">Copies the text and language; edit freely afterwards.</p>
		</form>
	{/if}

	<form
		id="letter"
		method="POST"
		action="?/save"
		class={box}
		use:enhance={() => {
			saving = true;
			return async ({ update }) => {
				await update({ reset: false });
				saving = false;
			};
		}}
	>
		<fieldset>
			<legend class="mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
				Language
			</legend>
			<div class="flex gap-4">
				{#each LANGUAGES as lang (lang.value)}
					<label class={option}>
						<input
							type="radio"
							name="language"
							value={lang.value}
							checked={v.language === lang.value}
						/>
						{lang.label}
					</label>
				{/each}
			</div>
			{#if errors.language}<FormMessage text={errors.language[0]} />{/if}
		</fieldset>

		<MarkdownEditor name="body" value={v.body} rows={18} label="Letter (Markdown)" />

		<fieldset class="space-y-2">
			<legend class="mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300"
				>In the PDF</legend
			>
			<label class={option}>
				<input type="checkbox" name="includeContact" checked={v.includeContact} class="rounded" />
				My name and contact details at the top
			</label>
			<label class={option}>
				<input
					type="checkbox"
					name="includeRecipient"
					bind:checked={includeRecipient}
					class="rounded"
				/>
				A recipient: {a.company}
			</label>
			{#if includeRecipient}
				<div class="pl-6">
					<label for="recipient" class="sr-only">Recipient contact</label>
					<select
						id="recipient"
						name="recipientContactId"
						value={v.recipientContactId ?? ''}
						class={field}
					>
						<option value="">The company only</option>
						{#each data.contacts as contact (contact.id)}
							<option value={contact.id}
								>{contact.name}{contact.role ? ` · ${contact.role}` : ''}</option
							>
						{/each}
					</select>
				</div>
			{:else if v.recipientContactId}
				<!-- Kept while the recipient is off, so ticking it again restores the choice. -->
				<input type="hidden" name="recipientContactId" value={v.recipientContactId} />
			{/if}
		</fieldset>
	</form>
</div>
