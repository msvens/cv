<script lang="ts">
	import { enhance } from '$app/forms';
	import CheckboxField from '$lib/components/admin/CheckboxField.svelte';
	import BilingualField from '$lib/components/admin/BilingualField.svelte';
	import DeleteButton from '$lib/components/admin/DeleteButton.svelte';
	import FormMessage from '$lib/components/admin/FormMessage.svelte';
	import ReorderButtons from '$lib/components/admin/ReorderButtons.svelte';
	import SubmitButton from '$lib/components/admin/SubmitButton.svelte';
	import TextField from '$lib/components/admin/TextField.svelte';

	let { data, form } = $props();

	// A failed create comes back with the submitted values: keep the form open with them.
	const failed = $derived(form && 'values' in form && form.values ? form.values : null);
	const errors: Partial<Record<string, string[]>> = $derived(
		(form && 'errors' in form && form.errors) || {}
	);
	let showNew = $state(false);
	let pending = $state(false);

	const itemsText = (n: number) => (n === 1 ? '1 item' : `${n} items`);
	const select =
		'w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100';
</script>

<h1 class="mb-6 text-2xl font-light text-neutral-900 dark:text-neutral-100">Sections</h1>

<div class="space-y-4">
	{#if form && 'message' in form && form.message}
		<FormMessage kind="success" text={form.message} />
	{:else if form && 'error' in form && form.error}
		<FormMessage kind="error" text={form.error} />
	{/if}

	<ul class="space-y-2">
		{#each data.sections as section, i (section.id)}
			<li
				class="flex items-center gap-3 rounded border border-neutral-200 p-4 dark:border-neutral-800"
			>
				<div class="min-w-0 flex-1">
					<a
						href="/admin/sections/{section.id}"
						class="font-medium text-neutral-900 hover:underline dark:text-neutral-100"
						>{section.labelEn}</a
					>
					<span class="ml-2 text-xs text-neutral-500"
						>{section.slug} · {section.displayType} · {itemsText(
							section.itemCount
						)}{!section.visible ? ' · hidden' : ''}{!section.showInPdf ? ' · not in PDF' : ''}</span
					>
				</div>
				<DeleteButton
					action="?/delete"
					id={section.id}
					confirmText={section.itemCount > 0
						? `Delete “${section.labelEn}” and its ${itemsText(section.itemCount)}?`
						: `Delete “${section.labelEn}”?`}
				/>
				<ReorderButtons
					action="?/move"
					id={section.id}
					isFirst={i === 0}
					isLast={i === data.sections.length - 1}
				/>
			</li>
		{/each}
	</ul>

	{#if showNew || failed}
		<form
			method="POST"
			action="?/create"
			class="space-y-4 rounded border border-neutral-200 p-4 dark:border-neutral-800"
			use:enhance={() => {
				pending = true;
				return async ({ result, update }) => {
					await update();
					pending = false;
					if (result.type === 'success') showNew = false;
				};
			}}
		>
			<h2 class="font-medium text-neutral-900 dark:text-neutral-100">New section</h2>
			{#if failed}
				<FormMessage kind="error" text="Please fix the fields marked below." />
			{/if}
			<TextField
				label="Slug"
				name="slug"
				value={failed?.slug}
				placeholder="e.g. certifications"
				hint="A short, unique id: lowercase letters, digits and hyphens."
				required
				errors={errors.slug}
			/>
			<BilingualField
				label="Label"
				nameEn="labelEn"
				nameSv="labelSv"
				valueEn={failed?.labelEn}
				valueSv={failed?.labelSv}
				errorsEn={errors.labelEn}
				errorsSv={errors.labelSv}
			/>
			<div>
				<label
					for="displayType"
					class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
					>Display type</label
				>
				<select
					id="displayType"
					name="displayType"
					class={select}
					value={failed?.displayType ?? 'entries'}
				>
					<option value="entries">Entries (full items)</option>
					<option value="chips">Chips (tags)</option>
				</select>
			</div>
			<div class="space-y-2">
				<CheckboxField
					label="Visible on website"
					name="visible"
					checked={failed?.visible ?? true}
				/>
				<CheckboxField
					label="Include in PDF"
					name="showInPdf"
					checked={failed?.showInPdf ?? true}
				/>
			</div>
			<div class="flex gap-2">
				<SubmitButton {pending} label="Create" />
				<button
					type="button"
					class="px-4 py-2 text-sm text-neutral-500 hover:text-neutral-700"
					onclick={() => (showNew = false)}>Cancel</button
				>
			</div>
		</form>
	{:else}
		<button
			class="rounded border border-neutral-300 px-4 py-2 text-sm transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
			onclick={() => (showNew = true)}>+ New section</button
		>
	{/if}
</div>
