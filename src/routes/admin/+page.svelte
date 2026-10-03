<script lang="ts">
	import { getTranslation } from '$lib/translations';

	let { data } = $props();

	const t = $derived(getTranslation(data.lang).admin);
</script>

<svelte:head>
	<title>{t.title}</title>
</svelte:head>

<main class="mx-auto max-w-4xl space-y-6 px-6 py-12">
	<h1 class="text-2xl font-light text-neutral-900 dark:text-neutral-100">{t.title}</h1>
	<p class="text-neutral-600 dark:text-neutral-400">
		{t.signedInAs} <span class="font-medium">@{data.login}</span>
	</p>
	<p class="text-sm text-neutral-500">{t.comingSoon}</p>
	<form method="POST" action="?/signout">
		<button
			class="rounded border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
		>
			{t.signOut}
		</button>
	</form>
</main>
