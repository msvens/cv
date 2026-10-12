<script lang="ts">
	import type { Snippet } from 'svelte';

	// An admin page's title, an optional link back up, and its page actions (Save, Delete…).
	let {
		title,
		subtitle,
		back,
		actions
	}: {
		title: string;
		subtitle?: string;
		back?: { href: string; label: string };
		actions?: Snippet;
	} = $props();
</script>

<header class="mb-6">
	{#if back}
		<a
			href={back.href}
			class="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
			>&larr; {back.label}</a
		>
	{/if}
	<div class="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
		<div class="min-w-0">
			<h1 class="text-2xl font-light break-words text-neutral-900 dark:text-neutral-100">
				{title}
			</h1>
			{#if subtitle}<p class="mt-1 text-sm text-neutral-500">{subtitle}</p>{/if}
		</div>
		{#if actions}
			<div class="flex items-center gap-3">{@render actions()}</div>
		{/if}
	</div>
</header>
