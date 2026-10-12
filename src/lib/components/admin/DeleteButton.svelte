<script lang="ts">
	import { Icon, Trash } from 'svelte-hero-icons';
	import { enhance } from '$app/forms';

	// A trash icon that opens a native modal dialog; only the dialog's Delete submits. `id` is
	// posted for list rows; a detail page's delete takes the id from its URL instead.
	let {
		action,
		id,
		confirmText,
		label = 'Delete'
	}: { action: string; id?: number; confirmText: string; label?: string } = $props();

	const uid = $props.id();
	let dialog: HTMLDialogElement | undefined = $state();
	let deleting = $state(false);

	const base = 'rounded px-3 py-1.5 text-sm transition-colors disabled:opacity-50';
	const solidRed = `${base} bg-red-600 text-white hover:bg-red-700`;
	const outlined = `${base} border border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800`;
</script>

<span class="group relative inline-flex">
	<button
		type="button"
		aria-label={label}
		class="rounded p-1.5 text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-neutral-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
		onclick={() => dialog?.showModal()}
	>
		<Icon src={Trash} class="h-5 w-5" />
	</button>
	<!-- Tooltip for sighted users; the button's aria-label already names it for screen readers. -->
	<span
		aria-hidden="true"
		class="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 rounded bg-neutral-900 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 dark:bg-neutral-100 dark:text-neutral-900"
		>{label}</span
	>
</span>

<dialog
	bind:this={dialog}
	aria-labelledby="{uid}-heading"
	class="m-auto max-w-md rounded-lg border border-neutral-200 bg-white p-6 text-neutral-900 shadow-xl backdrop:bg-black/40 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
>
	<h2 id="{uid}-heading" class="text-lg font-medium">{label}?</h2>
	<p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{confirmText}</p>
	<form
		method="POST"
		{action}
		class="mt-6 flex justify-end gap-2"
		use:enhance={() => {
			deleting = true;
			return async ({ update }) => {
				await update();
				deleting = false;
				dialog?.close();
			};
		}}
	>
		{#if id !== undefined}<input type="hidden" name="id" value={id} />{/if}
		<button type="button" class={outlined} onclick={() => dialog?.close()}>Cancel</button>
		<button disabled={deleting} class={solidRed}>{deleting ? 'Deleting…' : 'Delete'}</button>
	</form>
</dialog>
