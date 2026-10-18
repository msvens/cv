<script lang="ts">
	import { enhance } from '$app/forms';
	import { STATUSES, STATUS_LABELS, attentionLabel, statusLabel } from '$lib/applications';
	import type { SubmitFunction } from '@sveltejs/kit';
	import ContactFields from '$lib/components/admin/ContactFields.svelte';
	import DeleteButton from '$lib/components/admin/DeleteButton.svelte';
	import FormMessage from '$lib/components/admin/FormMessage.svelte';
	import PageHeader from '$lib/components/admin/PageHeader.svelte';
	import MarkdownEditor from '$lib/components/admin/MarkdownEditor.svelte';
	import SubmitButton from '$lib/components/admin/SubmitButton.svelte';
	import TextField from '$lib/components/admin/TextField.svelte';
	import { formatDay } from '$lib/dates';
	import { safeHref } from '$lib/markdown';

	let { data, form } = $props();

	const a = $derived(data.application);
	// A failed contact save names its form (`target`: 'new-contact' or the contact's id); a failed
	// details save has none. Each form shows only its own submission and errors.
	const target = $derived(form && 'target' in form ? form.target : null);
	const failed = $derived(form && 'values' in form && form.values ? form.values : null);
	const failedDetails = $derived(!target && failed && 'company' in failed ? failed : null);
	const failedContact = $derived(target && failed && 'name' in failed ? failed : null);
	// After a failed save, show what was submitted (with the errors); otherwise the stored values.
	const v = $derived(failedDetails ?? a);
	const allErrors: Partial<Record<string, string[]>> = $derived(
		(form && 'errors' in form && form.errors) || {}
	);
	const errors = $derived(target ? {} : allErrors);
	const contactErrors = (formId: string) => (target === formId ? allErrors : {});
	const contactValuesFor = <T,>(formId: string, stored: T) =>
		target === formId && failedContact ? failedContact : stored;

	let editingContact: number | null = $state(null);
	let addingContact = $state(false);
	let savingContact = $state(false);
	// On success, close whichever contact form was open.
	const closeOnSuccess: SubmitFunction = () => {
		savingContact = true;
		return async ({ result, update }) => {
			await update();
			savingContact = false;
			if (result.type === 'success') {
				editingContact = null;
				addingContact = false;
			}
		};
	};
	const adHref = $derived(a.adUrl ? safeHref(a.adUrl) : null);

	let saving = $state(false);
	let changing = $state(false);

	const tag = {
		overdue:
			'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400',
		soon: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300'
	};
	const box = 'max-w-3xl space-y-4 rounded border border-neutral-200 p-4 dark:border-neutral-800';
	const heading = 'font-medium text-neutral-900 dark:text-neutral-100';
	const field =
		'w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100';
	const label = 'mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300';
	const quiet = 'text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100';
</script>

<PageHeader
	title="{a.company} · {a.role}"
	back={{ href: '/admin/applications', label: 'Applications' }}
>
	{#snippet actions()}
		<SubmitButton form="details" pending={saving} />
		<span class="h-6 w-px bg-neutral-200 dark:bg-neutral-800" aria-hidden="true"></span>
		<DeleteButton
			action="?/delete"
			label="Delete application"
			confirmText="Delete “{a.company} · {a.role}” with its timeline, contacts and letter?"
		/>
	{/snippet}
</PageHeader>

<div class="space-y-8">
	{#if data.attention}
		<p class={['max-w-3xl rounded border px-4 py-2 text-sm font-medium', tag[data.attention.kind]]}>
			{attentionLabel(data.attention)}
		</p>
	{/if}

	{#if form && 'error' in form && form.error}
		<FormMessage text={form.error} />
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
		id="details"
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
		{#if failedDetails}
			<FormMessage text="Please fix the fields marked below." />
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
	</form>

	<section class={box} aria-labelledby="contacts-heading">
		<h2 id="contacts-heading" class={heading}>Contacts</h2>
		{#if data.contacts.length === 0 && !(addingContact || target === 'new-contact')}
			<p class="text-sm text-neutral-500">No contacts yet.</p>
		{/if}
		<ul class="space-y-2">
			{#each data.contacts as contact (contact.id)}
				{@const formId = String(contact.id)}
				<li>
					{#if editingContact === contact.id || target === formId}
						<form method="POST" action="?/updateContact" class={box} use:enhance={closeOnSuccess}>
							<input type="hidden" name="id" value={contact.id} />
							<ContactFields
								idPrefix="contact-{contact.id}"
								values={contactValuesFor(formId, contact)}
								errors={contactErrors(formId)}
							/>
							<div class="flex gap-2">
								<SubmitButton pending={savingContact} />
								<button type="button" class={quiet} onclick={() => (editingContact = null)}
									>Cancel</button
								>
							</div>
						</form>
					{:else}
						<div
							class="flex items-start gap-3 rounded border border-neutral-200 p-3 text-sm dark:border-neutral-800"
						>
							<div class="min-w-0 flex-1 space-y-0.5">
								<p>
									<span class="font-medium text-neutral-900 dark:text-neutral-100"
										>{contact.name}</span
									>{#if contact.role}<span class="text-neutral-500"> · {contact.role}</span>{/if}
								</p>
								{#if contact.email || contact.phone}
									<p class="flex flex-wrap gap-x-4">
										{#if contact.email}<a class="underline" href="mailto:{contact.email}"
												>{contact.email}</a
											>{/if}
										{#if contact.phone}<a class="underline" href="tel:{contact.phone}"
												>{contact.phone}</a
											>{/if}
									</p>
								{/if}
								{#if contact.note}
									<p class="whitespace-pre-line text-neutral-600 dark:text-neutral-400">
										{contact.note}
									</p>
								{/if}
							</div>
							<div class="flex shrink-0 items-center gap-2">
								<button class={quiet} onclick={() => (editingContact = contact.id)}>Edit</button>
								<DeleteButton
									action="?/deleteContact"
									id={contact.id}
									label="Delete contact"
									confirmText="Delete “{contact.name}”?"
								/>
							</div>
						</div>
					{/if}
				</li>
			{/each}
		</ul>

		{#if addingContact || target === 'new-contact'}
			<form method="POST" action="?/addContact" class={box} use:enhance={closeOnSuccess}>
				<h3 class={heading}>New contact</h3>
				<ContactFields
					idPrefix="new-contact"
					values={contactValuesFor('new-contact', {})}
					errors={contactErrors('new-contact')}
				/>
				<div class="flex gap-2">
					<SubmitButton pending={savingContact} label="Add" />
					<button type="button" class={quiet} onclick={() => (addingContact = false)}>Cancel</button
					>
				</div>
			</form>
		{:else}
			<button
				class="rounded border border-neutral-300 px-4 py-2 text-sm transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
				onclick={() => (addingContact = true)}>+ Add contact</button
			>
		{/if}
	</section>

	<section class={box} aria-labelledby="letter-heading">
		<h2 id="letter-heading" class={heading}>Letter</h2>
		{#if data.letter}
			<div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
				<p class="text-neutral-600 dark:text-neutral-400">
					{data.letter.language === 'sv' ? 'Swedish' : 'English'} · updated {formatDay(
						data.letter.updatedAt
					)}
				</p>
				<a class="underline" href="/admin/applications/{a.id}/letter">Edit</a>
				<a class="underline" href="/admin/applications/{a.id}/letter.pdf" target="_blank"
					>View PDF</a
				>
			</div>
		{:else}
			<p class="text-sm text-neutral-500">No letter yet.</p>
			<a
				class="inline-block rounded border border-neutral-300 px-4 py-2 text-sm transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
				href="/admin/applications/{a.id}/letter">Write a letter</a
			>
		{/if}
	</section>
</div>
