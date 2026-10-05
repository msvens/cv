<script lang="ts">
	let { pending = false, label = 'Save' }: { pending?: boolean; label?: string } = $props();
</script>

<button
	type="submit"
	disabled={pending}
	class="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
>
	{pending ? 'Saving…' : label}
</button>
