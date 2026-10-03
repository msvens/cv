<script lang="ts">
	import { getTranslation } from '$lib/translations';

	let { data } = $props();

	const t = $derived(getTranslation(data.lang).admin);
</script>

<svelte:head>
	<title>{t.title}</title>
</svelte:head>

<main class="flex min-h-[60vh] items-center justify-center px-6">
	<div class="space-y-6 text-center">
		<h1 class="text-2xl font-light text-neutral-900 dark:text-neutral-100">{t.title}</h1>
		<p class="text-neutral-500">{t.signInIntro}</p>
		{#if data.denied}
			<p class="text-sm text-red-500" role="alert">{t.accessDenied}</p>
		{/if}
		<form method="POST">
			<button
				class="rounded bg-neutral-900 px-6 py-2.5 font-medium text-white transition-opacity hover:opacity-90 dark:bg-neutral-100 dark:text-neutral-900"
			>
				{t.signIn}
			</button>
		</form>
	</div>
</main>
