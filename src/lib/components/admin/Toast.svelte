<script lang="ts">
	import { CheckCircle, Icon, XMark } from 'svelte-hero-icons';
	import { page } from '$app/state';

	// Every admin action that succeeds and stays on the page returns { message }; it shows here
	// for a few seconds or until closed. Derived from page.form (not set in an effect) so it also
	// renders on the server after a POST without JavaScript. A new submit is a new page.form, so
	// it shows again. Styled like the toasts in mphotos-svelte.
	const SHOW_MS = 4000;

	// Raw: a deep $state would wrap page.form in a proxy and never compare equal to it.
	let dismissed: unknown = $state.raw(null);
	const message = $derived(
		page.form !== dismissed && typeof page.form?.message === 'string' ? page.form.message : null
	);
	const dismiss = () => (dismissed = page.form);

	$effect(() => {
		if (!message) return;
		const timer = setTimeout(dismiss, SHOW_MS);
		return () => clearTimeout(timer);
	});
</script>

<!-- The live region is always in the DOM so screen readers announce what appears in it. It sits
     below the sticky top bar (z-50) and above it in stacking order. -->
<div role="status" class="pointer-events-none fixed top-20 right-4 z-60 sm:right-6">
	{#if message}
		<div
			class="toast-enter pointer-events-auto flex max-w-[568px] min-w-[288px] items-center gap-3 rounded bg-blue-600 px-4 py-3 text-white shadow-xl"
		>
			<Icon src={CheckCircle} class="h-6 w-6 shrink-0" />
			<p class="flex-1 text-sm">{message}</p>
			<button
				type="button"
				aria-label="Close"
				class="shrink-0 cursor-pointer transition-colors hover:text-neutral-300"
				onclick={dismiss}
			>
				<Icon src={XMark} class="h-5 w-5" />
			</button>
		</div>
	{/if}
</div>

<style>
	@keyframes slide-in {
		from {
			transform: translateX(100%);
		}
		to {
			transform: translateX(0);
		}
	}

	.toast-enter {
		animation: slide-in 0.3s ease-out;
	}
</style>
