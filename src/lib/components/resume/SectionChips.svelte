<script lang="ts">
	let { chips }: { chips: string[] } = $props();
</script>

<div class="flex flex-wrap gap-2">
	{#each chips as chip, i (i)}
		<span
			class="rounded-sm border border-neutral-300 px-3 py-1 text-sm text-neutral-700 dark:border-neutral-700 dark:text-neutral-300"
		>
			{chip}
		</span>
	{/each}
</div>
