<script lang="ts">
	import { Envelope, Icon, MapPin, Phone } from 'svelte-hero-icons';
	import type { Language } from '$lib/i18n';
	import type { HeaderView } from '$lib/resume';
	import { getTranslation } from '$lib/translations';
	import Markdown from './Markdown.svelte';

	let { header, lang }: { header: HeaderView; lang: Language } = $props();

	const t = $derived(getTranslation(lang).resume);
</script>

<header class="mb-12">
	<div class="flex items-center gap-5">
		{#if header.photoUrl}
			<!-- The file is pre-sized (256 px) for this 72–96 px avatar; see MIGRATION.md #15. -->
			<img
				src={header.photoUrl}
				alt={header.name}
				width="72"
				height="72"
				class="shrink-0 rounded-full object-cover md:h-24 md:w-24"
			/>
		{/if}
		<div class="min-w-0">
			<h1 class="text-lg font-semibold text-neutral-900 sm:text-xl dark:text-neutral-100">
				{header.name}<span class="font-normal text-neutral-400 dark:text-neutral-500"
					>, {header.title}</span
				>
			</h1>
			<div
				class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500 dark:text-neutral-400"
			>
				<a
					href="mailto:{header.email}"
					class="flex items-center gap-1 hover:text-neutral-900 dark:hover:text-neutral-200"
				>
					<Icon src={Envelope} class="h-3.5 w-3.5" />
					{header.email}
				</a>
				<span class="flex items-center gap-1">
					<Icon src={MapPin} class="h-3.5 w-3.5" />
					{header.location}
				</span>
				{#if header.phone}
					<span class="flex items-center gap-1">
						<Icon src={Phone} class="h-3.5 w-3.5" />
						{header.phone}
					</span>
				{/if}
				{#if header.available}
					<span class="flex items-center gap-1.5">
						<span class="inline-block h-2 w-2 rounded-full bg-green-500"></span>
						<span class="text-xs">{t.available}</span>
					</span>
				{/if}
			</div>
		</div>
	</div>

	<div
		class="mt-8 max-w-3xl text-sm leading-relaxed text-neutral-600 sm:text-base dark:text-neutral-400"
	>
		<Markdown blocks={header.bio} />
	</div>
</header>
