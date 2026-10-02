<script lang="ts">
	import '@fontsource-variable/geist-mono';
	import { onMount } from 'svelte';
	import './layout.css';
	import Footer from '$lib/components/layout/Footer.svelte';
	import TopBar from '$lib/components/layout/TopBar.svelte';
	import { socialLinks } from '$lib/social';
	import { initTheme, theme } from '$lib/stores/theme.svelte';
	import { getTranslation } from '$lib/translations';

	let { data, children } = $props();

	const links = $derived(socialLinks(data.profile));
	const meta = $derived(getTranslation(data.lang).meta);
	const name = $derived(data.profile?.name ?? null);

	// Effects run in creation order: adopt the stored theme first, so the sync below never
	// clears the class the pre-paint script in app.html already set.
	onMount(initTheme);

	// Apply the theme to <html> (Tailwind class-based dark mode) and keep it in sync after a
	// toggle.
	$effect(() => {
		document.documentElement.classList.toggle('dark', theme.current === 'dark');
	});
</script>

<svelte:head>
	<title>{name ? `${name} — ${meta.resume}` : meta.resume}</title>
	{#if name}
		<meta name="description" content="{meta.descriptionOf} {name}" />
	{/if}
</svelte:head>

<div class="flex min-h-screen flex-col font-sans">
	<TopBar lang={data.lang} {links} />
	<div class="flex-1">
		{@render children()}
	</div>
	<Footer lang={data.lang} {name} {links} updatedAt={data.profile?.updatedAt ?? null} />
</div>
