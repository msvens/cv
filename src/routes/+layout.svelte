<script lang="ts">
	import '@fontsource-variable/geist-mono';
	import { onMount } from 'svelte';
	import './layout.css';
	import { initTheme, theme } from '$lib/stores/theme.svelte';

	let { children } = $props();

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
	<div class="flex-1">
		{@render children()}
	</div>
</div>
