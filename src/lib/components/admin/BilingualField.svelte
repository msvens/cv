<script lang="ts">
	import MarkdownEditor from './MarkdownEditor.svelte';

	let {
		label,
		nameEn,
		nameSv,
		valueEn = '',
		valueSv = '',
		markdown = false,
		rows = 4,
		errorsEn,
		errorsSv,
		idPrefix
	}: {
		label: string;
		nameEn: string;
		nameSv: string;
		valueEn?: string | null;
		valueSv?: string | null;
		markdown?: boolean;
		rows?: number;
		errorsEn?: string[];
		errorsSv?: string[];
		/** Keeps element ids unique when several forms with the same fields share a page. */
		idPrefix?: string;
	} = $props();

	const idOf = (name: string) => (idPrefix ? `${idPrefix}-${name}` : name);

	const fields = $derived([
		{ name: nameEn, value: valueEn ?? '', lang: 'EN', errors: errorsEn },
		{ name: nameSv, value: valueSv ?? '', lang: 'SV', errors: errorsSv }
	]);
</script>

<fieldset class="space-y-2">
	<legend class="text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</legend>
	<div class={['grid grid-cols-1 gap-3', !markdown && 'md:grid-cols-2']}>
		{#each fields as field (field.name)}
			<div>
				{#if markdown}
					<MarkdownEditor
						name={field.name}
						id={idOf(field.name)}
						value={field.value}
						{rows}
						label={field.lang}
					/>
				{:else}
					<label for={idOf(field.name)} class="mb-1 block text-xs text-neutral-500"
						>{field.lang}</label
					>
					<input
						id={idOf(field.name)}
						name={field.name}
						value={field.value}
						aria-invalid={field.errors ? true : undefined}
						class={[
							'w-full rounded border bg-white px-3 py-2 text-sm text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100',
							field.errors ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
						]}
					/>
				{/if}
				{#if field.errors}
					<p class="mt-1 text-xs text-red-500">{field.lang}: {field.errors.join(' ')}</p>
				{/if}
			</div>
		{/each}
	</div>
</fieldset>
