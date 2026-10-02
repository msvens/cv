<script lang="ts">
	import type { EntryView } from '$lib/resume';
	import Markdown from './Markdown.svelte';

	let { entry }: { entry: EntryView } = $props();
</script>

<div
	class="mt-8 border-t border-neutral-200 pt-8 first:mt-0 first:border-0 first:pt-0 dark:border-neutral-800"
>
	<h3 class="text-base font-semibold text-neutral-900 sm:text-xl dark:text-neutral-100">
		{#if entry.link}
			<a href={entry.link} target="_blank" rel="noopener noreferrer" class="hover:underline"
				>{entry.title}</a
			>
		{:else}
			{entry.title}
		{/if}
	</h3>
	{#if entry.subtitle}
		<p class="mt-0.5 text-neutral-500 italic dark:text-neutral-400">{entry.subtitle}</p>
	{/if}
	{#if entry.dateRange}
		<p class="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{entry.dateRange}</p>
	{/if}
	{#if entry.description}
		<div class="mt-4 text-sm leading-relaxed text-neutral-700 sm:text-base dark:text-neutral-300">
			<Markdown blocks={entry.description} />
		</div>
	{/if}
</div>
