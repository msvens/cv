<script lang="ts">
	import { formatMonthYear } from '$lib/dates';
	import type { Language } from '$lib/i18n';
	import type { SocialLink } from '$lib/social';
	import { getTranslation } from '$lib/translations';

	let {
		lang,
		name,
		links,
		updatedAt
	}: { lang: Language; name: string | null; links: SocialLink[]; updatedAt: Date | null } =
		$props();

	const t = $derived(getTranslation(lang).footer);
</script>

<footer class="no-print mt-16 border-t border-neutral-200 dark:border-neutral-800">
	<div
		class="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-y-2 px-6 py-6 text-sm text-neutral-500 dark:text-neutral-400"
	>
		<!-- Each entry after the first carries its own leading "·", so a missing name or link
		     never leaves a dangling separator. -->
		<div class="flex items-center gap-2">
			{#if name}
				<span class="font-medium text-neutral-700 dark:text-neutral-300">{name}</span>
			{/if}
			{#each links as link, i (link.label)}
				{#if name || i > 0}<span aria-hidden="true">·</span>{/if}
				<a
					href={link.href}
					target="_blank"
					rel="noopener noreferrer"
					class="hover:text-neutral-900 dark:hover:text-neutral-100"
				>
					{link.label}
				</a>
			{/each}
			{#if name || links.length > 0}<span aria-hidden="true">·</span>{/if}
			<a href="/admin" class="hover:text-neutral-900 dark:hover:text-neutral-100">{t.admin}</a>
		</div>
		{#if updatedAt}
			<div>{t.updated} {formatMonthYear(updatedAt, lang)}</div>
		{/if}
	</div>
</footer>
