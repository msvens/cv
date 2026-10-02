<script lang="ts">
	import ResumeHeader from '$lib/components/resume/ResumeHeader.svelte';
	import ResumeSection from '$lib/components/resume/ResumeSection.svelte';
	import SectionChips from '$lib/components/resume/SectionChips.svelte';
	import SectionEntry from '$lib/components/resume/SectionEntry.svelte';
	import { getTranslation } from '$lib/translations';

	let { data } = $props();
</script>

{#if data.resume}
	<main class="mx-auto max-w-4xl px-6 py-8 md:py-20">
		<ResumeHeader header={data.resume.header} lang={data.lang} />

		{#each data.resume.sections as section (section.id)}
			<ResumeSection label={section.label}>
				{#if section.kind === 'chips'}
					<SectionChips chips={section.chips} />
				{:else}
					{#each section.entries as entry (entry.id)}
						<SectionEntry {entry} />
					{/each}
				{/if}
			</ResumeSection>
		{/each}
	</main>
{:else}
	<main class="flex min-h-screen items-center justify-center">
		<p class="text-neutral-500">{getTranslation(data.lang).resume.empty}</p>
	</main>
{/if}
