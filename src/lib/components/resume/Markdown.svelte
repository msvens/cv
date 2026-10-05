<script lang="ts">
	import type { MdBlock, MdInline } from '$lib/markdown';

	// Renders the tree from `$lib/markdownParse.ts` element by element. Every string goes
	// through Svelte's normal text escaping; nothing is inserted as HTML. Classes are the old
	// Markdown.tsx's.
	let { blocks }: { blocks: MdBlock[] } = $props();

	// Markdown headings are subheadings here: the page's own h1 (name) and h2 (section titles)
	// sit above them, so # / ## / ### render as h3 / h4 / h5, modestly sized.
	const headingClass = {
		1: 'mt-4 mb-2 text-base font-semibold text-neutral-900 first:mt-0 dark:text-neutral-100',
		2: 'mt-3 mb-1.5 text-sm font-semibold text-neutral-900 first:mt-0 dark:text-neutral-100',
		3: 'mt-3 mb-1 text-sm font-medium text-neutral-800 first:mt-0 dark:text-neutral-200'
	} as const;
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
		{:else if node.kind === 'heading'}
			<svelte:element this={`h${node.level + 2}`} class={headingClass[node.level]}
				>{@render inlines(node.children)}</svelte:element
			>
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
