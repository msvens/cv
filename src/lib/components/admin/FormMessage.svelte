<script lang="ts">
	// Errors stay next to the form they belong to; success messages are toasts (Toast.svelte).
	let { text }: { text: string } = $props();
</script>

<p role="alert" class="text-sm text-red-500">{text}</p>
