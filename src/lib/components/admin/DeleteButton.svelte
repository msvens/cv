<script lang="ts">
	import { enhance } from '$app/forms';

	// Two steps, no window.confirm: the first click asks, Confirm submits.
	let {
		action,
		id,
		confirmText,
		label = 'Delete'
	}: { action: string; id: number; confirmText: string; label?: string } = $props();

	let confirming = $state(false);
	let deleting = $state(false);

	const base = 'rounded px-3 py-1.5 text-sm transition-colors disabled:opacity-50';
	const outlinedRed = `${base} border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40`;
	const solidRed = `${base} bg-red-600 text-white hover:bg-red-700`;
	const outlined = `${base} border border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800`;
</script>

{#if confirming}
	<form
		method="POST"
		{action}
		class="inline-flex flex-wrap items-center gap-2 text-sm"
		use:enhance={() => {
			deleting = true;
			return async ({ update }) => {
				await update();
				deleting = false;
				confirming = false;
			};
		}}
	>
		<input type="hidden" name="id" value={id} />
		<span class="text-neutral-600 dark:text-neutral-400">{confirmText}</span>
		<button disabled={deleting} class={solidRed}>
			{deleting ? 'Deleting…' : 'Confirm'}
		</button>
		<button type="button" class={outlined} onclick={() => (confirming = false)}>Cancel</button>
	</form>
{:else}
	<button type="button" class={outlinedRed} onclick={() => (confirming = true)}>{label}</button>
{/if}
