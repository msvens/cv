<script lang="ts">
	import BilingualField from './BilingualField.svelte';
	import TextField from './TextField.svelte';

	/** An item's editable fields: a stored row or a failed submission both fit. */
	interface Values {
		titleEn?: string | null;
		titleSv?: string | null;
		subtitleEn?: string | null;
		subtitleSv?: string | null;
		startDate?: string | null;
		endDate?: string | null;
		link?: string | null;
		descriptionEn?: string | null;
		descriptionSv?: string | null;
	}

	// The fields of an item form (the parent supplies the <form>). Chip sections only have a
	// title; entries also have subtitle, dates, link and a markdown description.
	let {
		chips,
		values = {},
		errors = {},
		idPrefix = 'item'
	}: {
		chips: boolean;
		values?: Values;
		errors?: Partial<Record<string, string[]>>;
		idPrefix?: string;
	} = $props();

	const v = (key: keyof Values) => values[key] ?? '';
</script>

<div class="space-y-4">
	<BilingualField
		label="Title"
		nameEn="titleEn"
		nameSv="titleSv"
		valueEn={v('titleEn')}
		valueSv={v('titleSv')}
		errorsEn={errors.titleEn}
		errorsSv={errors.titleSv}
		{idPrefix}
	/>
	{#if !chips}
		<BilingualField
			label="Subtitle"
			nameEn="subtitleEn"
			nameSv="subtitleSv"
			valueEn={v('subtitleEn')}
			valueSv={v('subtitleSv')}
			{idPrefix}
		/>
		<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
			<TextField
				label="Start date"
				name="startDate"
				id="{idPrefix}-startDate"
				type="date"
				value={v('startDate')}
				errors={errors.startDate}
			/>
			<TextField
				label="End date"
				name="endDate"
				id="{idPrefix}-endDate"
				type="date"
				value={v('endDate')}
				hint="Leave empty for ongoing"
				errors={errors.endDate}
			/>
		</div>
		<TextField
			label="Link"
			name="link"
			id="{idPrefix}-link"
			value={v('link')}
			placeholder="https://…"
			errors={errors.link}
		/>
		<BilingualField
			label="Description (Markdown)"
			nameEn="descriptionEn"
			nameSv="descriptionSv"
			valueEn={v('descriptionEn')}
			valueSv={v('descriptionSv')}
			markdown
			rows={6}
			{idPrefix}
		/>
	{/if}
</div>
