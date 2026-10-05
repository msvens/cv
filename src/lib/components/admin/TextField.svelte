<script lang="ts">
	let {
		label,
		name,
		id = name,
		value = '',
		type = 'text',
		required = false,
		placeholder,
		hint,
		errors
	}: {
		label: string;
		name: string;
		id?: string;
		value?: string | null;
		type?: string;
		required?: boolean;
		placeholder?: string;
		hint?: string;
		errors?: string[];
	} = $props();
</script>

<div>
	<label for={id} class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
		>{label}</label
	>
	<input
		{id}
		{name}
		{type}
		{required}
		{placeholder}
		value={value ?? ''}
		aria-invalid={errors ? true : undefined}
		aria-describedby={errors ? `${id}-error` : hint ? `${id}-hint` : undefined}
		class={[
			'w-full rounded border bg-white px-3 py-2 text-sm text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100',
			errors ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
		]}
	/>
	{#if errors}
		<p id="{id}-error" class="mt-1 text-xs text-red-500">{errors.join(' ')}</p>
	{:else if hint}
		<p id="{id}-hint" class="mt-1 text-xs text-neutral-500">{hint}</p>
	{/if}
</div>
