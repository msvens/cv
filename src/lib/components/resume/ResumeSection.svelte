<script lang="ts">
	import type { Snippet } from 'svelte';

	let { label, children }: { label: string; children: Snippet } = $props();
</script>

<section class="mb-10 grid grid-cols-1 gap-x-8 gap-y-4 md:mb-16 md:grid-cols-[180px_1fr]">
	<!-- Sticky below the TopBar while the section scrolls by (offset tuned in the old app). -->
	<div class="self-start md:sticky md:top-20">
		<h2 class="font-mono text-xs tracking-[0.2em] text-neutral-500 uppercase dark:text-neutral-400">
			{label}
		</h2>
	</div>
	<div>{@render children()}</div>
</section>
