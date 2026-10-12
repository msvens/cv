<script lang="ts">
	import type { SubmitFunction } from '@sveltejs/kit';
	import { enhance } from '$app/forms';
	import BilingualField from '$lib/components/admin/BilingualField.svelte';
	import CheckboxField from '$lib/components/admin/CheckboxField.svelte';
	import DeleteButton from '$lib/components/admin/DeleteButton.svelte';
	import FormMessage from '$lib/components/admin/FormMessage.svelte';
	import ItemFields from '$lib/components/admin/ItemFields.svelte';
	import PageHeader from '$lib/components/admin/PageHeader.svelte';
	import ReorderButtons from '$lib/components/admin/ReorderButtons.svelte';
	import SubmitButton from '$lib/components/admin/SubmitButton.svelte';
	import TextField from '$lib/components/admin/TextField.svelte';

	let { data, form } = $props();

	const section = $derived(data.section);
	const chips = $derived(section.displayType === 'chips');

	// A failed save names the form it came from; that form reopens with what was typed.
	const target = $derived(form && 'target' in form ? form.target : null);
	const failedValues = $derived(form && 'values' in form && form.values ? form.values : null);
	const errors: Partial<Record<string, string[]>> = $derived(
		(form && 'errors' in form && form.errors) || {}
	);

	let editingSection = $state(false);
	let editingItem: number | null = $state(null);
	let addingItem = $state(false);
	let pending = $state(false);

	// Shared enhance: on success, close whatever form was open.
	const closeOnSuccess: SubmitFunction = () => {
		pending = true;
		return async ({ result, update }) => {
			await update();
			pending = false;
			if (result.type === 'success') {
				editingSection = false;
				editingItem = null;
				addingItem = false;
			}
		};
	};

	// Narrow the failed submission to the form it came from (each has a field the other lacks).
	const failedSection = $derived(failedValues && 'slug' in failedValues ? failedValues : null);
	const failedItem = $derived(failedValues && 'titleEn' in failedValues ? failedValues : null);
	const sectionValues = $derived(target === 'section' && failedSection ? failedSection : section);
	const sectionFormOpen = $derived(editingSection || target === 'section');
	const details = $derived(
		`${section.slug} · ${section.displayType}${!section.visible ? ' · hidden' : ''}${!section.showInPdf ? ' · not in PDF' : ''}`
	);
	const itemsText = (n: number) => (n === 1 ? '1 item' : `${n} items`);
	const select =
		'w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100';
	const quiet = 'text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100';
	const box = 'space-y-4 rounded border border-neutral-200 p-4 dark:border-neutral-800';
</script>

<div class="space-y-8">
	<PageHeader
		title={section.labelEn}
		subtitle={sectionFormOpen ? undefined : details}
		back={{ href: '/admin/sections', label: 'Sections' }}
	>
		{#snippet actions()}
			{#if !sectionFormOpen}
				<button class={quiet} onclick={() => (editingSection = true)}>Edit section</button>
			{/if}
			<DeleteButton
				action="?/delete"
				label="Delete section"
				confirmText={data.items.length > 0
					? `Delete “${section.labelEn}” and its ${itemsText(data.items.length)}?`
					: `Delete “${section.labelEn}”?`}
			/>
		{/snippet}
	</PageHeader>

	{#if form && 'error' in form && form.error}
		<FormMessage text={form.error} />
	{/if}

	{#if sectionFormOpen}
		<form method="POST" action="?/update" class={box} use:enhance={closeOnSuccess}>
			<h2 class="font-medium text-neutral-900 dark:text-neutral-100">Edit section</h2>
			<TextField
				label="Slug"
				name="slug"
				value={sectionValues.slug}
				required
				errors={errors.slug}
			/>
			<BilingualField
				label="Label"
				nameEn="labelEn"
				nameSv="labelSv"
				valueEn={sectionValues.labelEn}
				valueSv={sectionValues.labelSv}
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
					value={sectionValues.displayType}
				>
					<option value="entries">Entries (full items)</option>
					<option value="chips">Chips (tags)</option>
				</select>
			</div>
			<div class="space-y-2">
				<CheckboxField label="Visible on website" name="visible" checked={sectionValues.visible} />
				<CheckboxField label="Include in PDF" name="showInPdf" checked={sectionValues.showInPdf} />
			</div>
			<div class="flex gap-2">
				<SubmitButton {pending} />
				<button type="button" class={quiet} onclick={() => (editingSection = false)}>Cancel</button>
			</div>
		</form>
	{/if}

	<section class="space-y-4">
		<h2 class="text-lg font-medium text-neutral-900 dark:text-neutral-100">
			Items ({data.items.length})
		</h2>
		<ul class="space-y-2">
			{#each data.items as item, i (item.id)}
				<li>
					{#if editingItem === item.id || target === String(item.id)}
						<form method="POST" action="?/updateItem" class={box} use:enhance={closeOnSuccess}>
							<input type="hidden" name="id" value={item.id} />
							<ItemFields
								{chips}
								idPrefix="item-{item.id}"
								values={target === String(item.id) && failedItem ? failedItem : item}
								errors={target === String(item.id) ? errors : {}}
							/>
							<div class="flex gap-2">
								<SubmitButton {pending} />
								<button type="button" class={quiet} onclick={() => (editingItem = null)}
									>Cancel</button
								>
							</div>
						</form>
					{:else}
						<div
							class="flex items-center gap-3 rounded border border-neutral-200 p-3 dark:border-neutral-800"
						>
							<div class="min-w-0 flex-1">
								<span class="text-sm font-medium text-neutral-900 dark:text-neutral-100"
									>{item.titleEn}</span
								>
								{#if item.subtitleEn}<span class="ml-2 text-xs text-neutral-500"
										>{item.subtitleEn}</span
									>{/if}
							</div>
							<div class="flex shrink-0 items-center gap-3">
								<button class={quiet} onclick={() => (editingItem = item.id)}>Edit</button>
								<DeleteButton
									action="?/deleteItem"
									id={item.id}
									confirmText="Delete “{item.titleEn}”?"
								/>
							</div>
							<ReorderButtons
								action="?/moveItem"
								id={item.id}
								isFirst={i === 0}
								isLast={i === data.items.length - 1}
							/>
						</div>
					{/if}
				</li>
			{/each}
		</ul>

		{#if addingItem || target === 'new-item'}
			<form method="POST" action="?/createItem" class={box} use:enhance={closeOnSuccess}>
				<h3 class="font-medium text-neutral-900 dark:text-neutral-100">New item</h3>
				<ItemFields
					{chips}
					idPrefix="new-item"
					values={target === 'new-item' && failedItem ? failedItem : {}}
					errors={target === 'new-item' ? errors : {}}
				/>
				<div class="flex gap-2">
					<SubmitButton {pending} label="Add" />
					<button type="button" class={quiet} onclick={() => (addingItem = false)}>Cancel</button>
				</div>
			</form>
		{:else}
			<button
				class="rounded border border-neutral-300 px-4 py-2 text-sm transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
				onclick={() => (addingItem = true)}>+ New item</button
			>
		{/if}
	</section>
</div>
