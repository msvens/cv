<script lang="ts">
	let { kind, text }: { kind: 'success' | 'error'; text: string } = $props();
</script>

<p
	role={kind === 'error' ? 'alert' : 'status'}
	class={['text-sm', kind === 'error' ? 'text-red-500' : 'text-green-600']}
>
	{text}
</p>
