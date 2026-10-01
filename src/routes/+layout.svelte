<script lang="ts">
	import '@fontsource-variable/geist-mono';
	import './layout.css';

	let { children } = $props();
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
