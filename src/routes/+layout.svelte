<script lang="ts">
	import '@fontsource-variable/geist-mono';
	import { onMount } from 'svelte';
	import './layout.css';
	import Footer from '$lib/components/layout/Footer.svelte';
	import TopBar from '$lib/components/layout/TopBar.svelte';
	import { socialLinks } from '$lib/social';
	import { initTheme, theme } from '$lib/stores/theme.svelte';

	let { data, children } = $props();

	const links = $derived(socialLinks(data.profile));

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
	<title>Martin Svensson — Resume</title>
	<meta name="description" content="Resume and portfolio of Martin Svensson" />
</svelte:head>

<div class="flex min-h-screen flex-col font-sans">
	<TopBar lang={data.lang} {links} />
	<div class="flex-1">
		{@render children()}
	</div>
	<Footer
		lang={data.lang}
		name={data.profile?.name ?? null}
		{links}
		updatedAt={data.profile?.updatedAt ?? null}
	/>
</div>
