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
		<button disabled={deleting} class="text-red-600 hover:text-red-800 disabled:opacity-50">
			{deleting ? 'Deleting…' : 'Confirm'}
		</button>
		<button
			type="button"
			class="text-neutral-500 hover:text-neutral-700"
			onclick={() => (confirming = false)}>Cancel</button
		>
	</form>
{:else}
	<button
		type="button"
		class="text-sm text-red-500 hover:text-red-700"
		onclick={() => (confirming = true)}>{label}</button
	>
{/if}
