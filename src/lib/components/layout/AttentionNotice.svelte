<script lang="ts">
	import { page } from '$app/state';
	import type { Language } from '$lib/i18n';
	import { getTranslation, plural } from '$lib/translations';

	// R9: the signed-in admin sees what needs attention on the public pages. One application is
	// named and linked directly; more link to the applications page. `attention` is null for
	// everyone else (the root layout's load never computes it for them). Hidden in the admin,
	// where the nav shows the count.
	let {
		attention,
		lang
	}: {
		attention: { count: number; only: { id: number; company: string; role: string } | null } | null;
		lang: Language;
	} = $props();

	const path = $derived(page.url.pathname);
	const inAdmin = $derived(path === '/admin' || path.startsWith('/admin/'));
	const t = $derived(getTranslation(lang).notice);
	const only = $derived(attention?.only);
	const href = $derived(only ? `/admin/applications/${only.id}` : '/admin/applications');
	const text = $derived(
		only
			? t.needsAttention.replace('{name}', `${only.company} · ${only.role}`)
			: plural(attention?.count ?? 0, t.needAttention)
	);
</script>

{#if attention && attention.count > 0 && !inAdmin}
	<div
		class="no-print border-b border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
	>
		<div class="mx-auto max-w-4xl px-6 py-2 text-sm">
			<a {href} class="font-medium text-amber-800 hover:underline dark:text-amber-300"
				>{text} &rarr;</a
			>
		</div>
	</div>
{/if}
