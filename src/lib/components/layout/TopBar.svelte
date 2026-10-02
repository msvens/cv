<script lang="ts">
	import { ArrowDownTray, Bars3, Icon, Moon, Sun, XMark } from 'svelte-hero-icons';
	import type { Language } from '$lib/i18n';
	import { setLanguage } from '$lib/language';
	import type { SocialLink } from '$lib/social';
	import { theme } from '$lib/stores/theme.svelte';
	import { getTranslation } from '$lib/translations';

	let { lang, links }: { lang: Language; links: SocialLink[] } = $props();

	const t = $derived(getTranslation(lang).topBar);
	const nextLang = $derived<Language>(lang === 'en' ? 'sv' : 'en');
	const nextLangName = $derived(nextLang === 'sv' ? 'Svenska' : 'English');
	const nextLangFlag = $derived(nextLang === 'sv' ? '🇸🇪' : '🇬🇧');
	const pdfHref = $derived(`/api/pdf?lang=${lang}`);

	let menuOpen = $state(false);

	function closeMenu() {
		menuOpen = false;
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape') closeMenu();
	}}
/>

<!--
	Theme icons and labels: both variants are rendered and CSS shows the right one. The
	server can't know the theme (it lives in localStorage), so choosing by `theme.current`
	would render the wrong icon for dark users and mismatch on hydration.
-->
{#snippet themeIcon(size: string)}
	<Icon src={Moon} class="dark:hidden {size}" />
	<Icon src={Sun} class="hidden dark:block {size}" />
{/snippet}

<header
	class="no-print sticky top-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-950/80"
>
	<div class="mx-auto max-w-4xl px-6 py-3">
		<!-- Desktop: 8-column grid — 2 left, 4 center, 2 right -->
		<div class="hidden grid-cols-8 items-center md:grid">
			<div class="col-span-2 flex items-center">
				<a
					href="/"
					class="font-mono text-sm font-bold text-neutral-900 transition-opacity hover:opacity-70 dark:text-neutral-100"
				>
					MS
				</a>
			</div>

			<div class="col-span-4 flex items-center justify-center gap-6">
				{#each links as link (link.label)}
					<a
						href={link.href}
						target="_blank"
						rel="noopener noreferrer"
						class="text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
					>
						{link.label}
					</a>
				{/each}
			</div>

			<div class="col-span-2 flex items-center justify-end gap-2">
				<button
					onclick={() => setLanguage(nextLang)}
					class="p-2 text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-neutral-100"
					aria-label="{t.switchTo} {nextLangName}"
				>
					<span class="text-base">{nextLangFlag}</span>
				</button>
				<button
					onclick={() => theme.toggle()}
					class="p-2 text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-neutral-100"
					aria-label={t.toggleTheme}
				>
					{@render themeIcon('h-4 w-4')}
				</button>
				<a
					href={pdfHref}
					class="flex items-center gap-1.5 rounded border border-neutral-300 px-3 py-1.5 font-mono text-xs transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
				>
					<Icon src={ArrowDownTray} class="h-3.5 w-3.5" />
					{t.downloadPdf}
				</a>
			</div>
		</div>

		<!-- Mobile: logo + center links + hamburger -->
		<div class="flex items-center justify-between md:hidden">
			<a href="/" class="font-mono text-sm font-bold text-neutral-900 dark:text-neutral-100">
				MS
			</a>

			<div class="flex items-center gap-4">
				{#each links as link (link.label)}
					<a
						href={link.href}
						target="_blank"
						rel="noopener noreferrer"
						class="text-sm text-neutral-600 dark:text-neutral-400"
					>
						{link.label}
					</a>
				{/each}
			</div>

			<button
				onclick={() => (menuOpen = !menuOpen)}
				class="p-2 text-neutral-600 dark:text-neutral-400"
				aria-label={t.menu}
				aria-expanded={menuOpen}
				aria-controls="mobile-menu"
			>
				<Icon src={menuOpen ? XMark : Bars3} class="h-5 w-5" />
			</button>
		</div>
	</div>
</header>

<!-- Mobile overlay + drawer: outside <header> to escape its backdrop-blur stacking context. -->
<div
	class={[
		'no-print fixed inset-0 z-[60] bg-black/50 transition-opacity duration-200 md:hidden',
		menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
	]}
	onclick={closeMenu}
	aria-hidden="true"
></div>

<!-- `inert` while closed: hidden only visually, the drawer must not be reachable by Tab or
     screen readers either. -->
<div
	id="mobile-menu"
	inert={!menuOpen}
	class={[
		'no-print fixed top-[49px] right-0 z-[70] h-[calc(100vh-49px)] w-56 border-l border-neutral-200 bg-white shadow-lg transition-all duration-200 ease-in-out md:hidden dark:border-neutral-800 dark:bg-neutral-900',
		menuOpen ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-4 opacity-0'
	]}
>
	<div class="space-y-4 px-4 py-4">
		<button
			onclick={() => {
				setLanguage(nextLang);
				closeMenu();
			}}
			class="flex w-full items-center gap-3 py-2 text-sm text-neutral-600 dark:text-neutral-400"
		>
			<span class="text-base">{nextLangFlag}</span>
			{nextLangName}
		</button>
		<button
			onclick={() => {
				theme.toggle();
				closeMenu();
			}}
			class="flex w-full items-center gap-3 py-2 text-sm text-neutral-600 dark:text-neutral-400"
		>
			{@render themeIcon('h-4 w-4')}
			<span class="dark:hidden">{t.darkMode}</span>
			<span class="hidden dark:inline">{t.lightMode}</span>
		</button>
		<div class="border-t border-neutral-200 pt-2 dark:border-neutral-800">
			<a
				href={pdfHref}
				onclick={closeMenu}
				class="flex items-center gap-2 py-2 text-sm text-neutral-600 dark:text-neutral-400"
			>
				<Icon src={ArrowDownTray} class="h-4 w-4" />
				{t.downloadPdf}
			</a>
		</div>
	</div>
</div>
