<script lang="ts">
	// Phase 1 smoke page: proves the SSR load reads the database. Replaced by the real resume
	// components in phase 3 (see MIGRATION.md).
	let { data } = $props();
</script>

{#if data.profile}
	<main class="mx-auto max-w-4xl px-6 py-8 md:py-20">
		<h1 class="text-3xl font-semibold">{data.profile.name}</h1>
		<p class="text-neutral-500">{data.profile.titleEn}</p>
		{#each data.sections as section (section.id)}
			<h2 class="mt-8 font-mono text-xs tracking-[0.2em] text-neutral-500 uppercase">
				{section.labelEn}
			</h2>
			<ul class="mt-2 space-y-1">
				{#each section.items as item (item.id)}
					<li>{item.titleEn}</li>
				{/each}
			</ul>
		{/each}
	</main>
{:else}
	<main class="flex min-h-screen items-center justify-center">
		<p class="text-neutral-500">No profile data found. Run pnpm db:seed to populate.</p>
	</main>
{/if}
