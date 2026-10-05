<script lang="ts">
	import { ChevronDown, ChevronUp, Icon } from 'svelte-hero-icons';
	import { enhance } from '$app/forms';

	let {
		action,
		id,
		isFirst,
		isLast
	}: { action: string; id: number; isFirst: boolean; isLast: boolean } = $props();

	let moving = $state(false);
	const button =
		'p-0.5 text-neutral-600 transition-colors hover:text-neutral-900 disabled:cursor-default disabled:text-neutral-300 dark:text-neutral-300 dark:hover:text-neutral-100 dark:disabled:text-neutral-600';
</script>

<form
	method="POST"
	{action}
	class="flex flex-col gap-0.5"
	use:enhance={() => {
		moving = true;
		return async ({ update }) => {
			await update();
			moving = false;
		};
	}}
>
	<input type="hidden" name="id" value={id} />
	<button
		name="direction"
		value="up"
		disabled={isFirst || moving}
		class={button}
		aria-label="Move up"
	>
		<Icon src={ChevronUp} class="h-4 w-4" />
	</button>
	<button
		name="direction"
		value="down"
		disabled={isLast || moving}
		class={button}
		aria-label="Move down"
	>
		<Icon src={ChevronDown} class="h-4 w-4" />
	</button>
</form>
