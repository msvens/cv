<script lang="ts">
	import { ChevronDown, Icon } from 'svelte-hero-icons';
	import { page } from '$app/state';

	const items = [
		{ href: '/admin/applications', label: 'Applications' },
		{ href: '/admin/profile', label: 'Profile' },
		{ href: '/admin/sections', label: 'Sections' }
	];

	const isActive = (href: string) =>
		page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
	const current = $derived(items.find((i) => isActive(i.href))?.label ?? 'Admin');

	let menuOpen = $state(false);
	let menu: HTMLElement | undefined = $state();

	const link =
		'block rounded px-3 py-2 text-sm transition-colors text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-100';
	const activeLink =
		'block rounded px-3 py-2 text-sm font-medium bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100';
	const signOutButton =
		'block w-full px-3 py-2 text-left text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-neutral-100';
</script>

<svelte:window
	onclick={(e) => {
		if (menuOpen && menu && e.target instanceof Node && !menu.contains(e.target)) menuOpen = false;
	}}
	onkeydown={(e) => {
		if (e.key === 'Escape') menuOpen = false;
	}}
/>

{#snippet links(onclick?: () => void)}
	{#each items as item (item.href)}
		<a
			href={item.href}
			class={isActive(item.href) ? activeLink : link}
			aria-current={isActive(item.href) ? 'page' : undefined}
			{onclick}>{item.label}</a
		>
	{/each}
{/snippet}

{#snippet signOut()}
	<form method="POST" action="/admin/signout">
		<button class={signOutButton}>Sign out</button>
	</form>
{/snippet}

<!-- Desktop: sidebar -->
<aside
	class="hidden w-48 shrink-0 border-r border-neutral-200 py-6 pr-6 md:block dark:border-neutral-800"
>
	<nav aria-label="Admin" class="space-y-1">{@render links()}</nav>
	<div class="mt-3 border-t border-neutral-200 pt-3 dark:border-neutral-800">
		{@render signOut()}
	</div>
</aside>

<!-- Mobile: dropdown showing the current page -->
<div class="my-3 md:hidden" bind:this={menu}>
	<div
		class="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
	>
		<button
			class="flex w-full items-center justify-between px-4 py-3"
			aria-expanded={menuOpen}
			aria-controls="admin-menu"
			onclick={() => (menuOpen = !menuOpen)}
		>
			<span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">{current}</span>
			<!-- A plain string: the icon component predates Svelte 5's class arrays. -->
			<Icon
				src={ChevronDown}
				class={menuOpen
					? 'h-4 w-4 rotate-180 text-neutral-400 transition-transform'
					: 'h-4 w-4 text-neutral-400 transition-transform'}
			/>
		</button>
		{#if menuOpen}
			<div id="admin-menu" class="space-y-1 px-1 py-1">
				<nav aria-label="Admin (mobile)">{@render links(() => (menuOpen = false))}</nav>
				<div class="border-t border-neutral-200 dark:border-neutral-800">{@render signOut()}</div>
			</div>
		{/if}
	</div>
</div>
