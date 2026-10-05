<script lang="ts">
	let {
		label,
		name,
		checked = false
	}: { label: string; name: string; checked?: boolean } = $props();
</script>

<label class="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
	<input type="checkbox" {name} {checked} class="rounded" />
	{label}
</label>
