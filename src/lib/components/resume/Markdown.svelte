<script lang="ts">
	import type { MdBlock, MdInline } from '$lib/markdown';

	// Renders the tree from `$lib/server/markdown.ts` element by element. Every string goes
	// through Svelte's normal text escaping; nothing is inserted as HTML. Classes are the old
	// Markdown.tsx's.
	let { blocks }: { blocks: MdBlock[] } = $props();
</script>

{#snippet inlines(nodes: MdInline[])}
	{#each nodes as node, i (i)}{#if node.kind === 'text'}{node.text}{:else if node.kind === 'strong'}<strong
				class="font-semibold">{@render inlines(node.children)}</strong
			>{:else if node.kind === 'em'}<em>{@render inlines(node.children)}</em
			>{:else if node.kind === 'code'}<code>{node.text}</code>{:else if node.kind === 'br'}<br
			/>{:else}<a
				href={node.href}
				target="_blank"
				rel="noopener noreferrer"
				class="text-blue-600 hover:underline dark:text-blue-400">{@render inlines(node.children)}</a
			>{/if}{/each}
{/snippet}

{#snippet blockList(nodes: MdBlock[])}
	{#each nodes as node, i (i)}
		{#if node.kind === 'paragraph'}
			<p class="mb-2 last:mb-0">{@render inlines(node.children)}</p>
		{:else if node.kind === 'plain'}
			{@render inlines(node.children)}
		{:else if node.ordered}
			<ol class="mt-2 ml-6 list-decimal space-y-1">
				{#each node.items as item, j (j)}<li>{@render blockList(item)}</li>{/each}
			</ol>
		{:else}
			<ul class="mt-2 ml-6 list-disc space-y-1">
				{#each node.items as item, j (j)}<li>{@render blockList(item)}</li>{/each}
			</ul>
		{/if}
	{/each}
{/snippet}

{@render blockList(blocks)}
