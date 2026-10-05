<script lang="ts">
	import AdminNav from '$lib/components/admin/AdminNav.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<title>Admin</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-6 md:flex md:gap-8 md:py-8">
	<AdminNav />
	<div class="min-w-0 flex-1 py-6 md:py-6">{@render children()}</div>
</div>
