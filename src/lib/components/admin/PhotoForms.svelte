<script lang="ts">
	import type { SubmitFunction } from '@sveltejs/kit';
	import { enhance } from '$app/forms';
	import FormMessage from './FormMessage.svelte';
	import SubmitButton from './SubmitButton.svelte';

	// The profile photo: upload one (stored and resized by the server), or link an existing image
	// as-is, or remove it. One photo at a time — each replaces the other.
	let {
		photoUrl,
		message,
		error,
		urlValue
	}: { photoUrl: string | null; message?: string; error?: string; urlValue?: string } = $props();

	/** Same limit as the server (MAX_UPLOAD_BYTES); checked here too so nothing big is sent. */
	const MAX_BYTES = 10 * 1024 * 1024;

	const uploaded = $derived(photoUrl?.startsWith('/photo?') ?? false);
	let pending = $state(false);

	// Choosing a file (OK in the file dialog) uploads it at once — that is the decision to
	// replace the photo. Only a file over the limit is stopped here, before anything is sent.
	let fileInput: HTMLInputElement | undefined = $state();
	let uploadForm: HTMLFormElement | undefined = $state();
	let uploading: string | null = $state(null);
	let tooLarge: string | null = $state(null);

	function onChoose() {
		const file = fileInput?.files?.[0];
		if (!file) return;
		if (file.size > MAX_BYTES) {
			tooLarge = file.name;
			fileInput!.value = '';
			return;
		}
		tooLarge = null;
		uploading = file.name;
		uploadForm?.requestSubmit();
	}

	const busy: SubmitFunction = () => {
		pending = true;
		return async ({ result, update }) => {
			await update();
			pending = false;
			uploading = null;
			if (result.type === 'success' && fileInput) fileInput.value = '';
		};
	};

	const input =
		'w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100';
	const chooseButton =
		'inline-block cursor-pointer rounded border border-neutral-300 px-4 py-2 text-sm transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800';
	const hint = 'mt-1 text-xs text-neutral-500';
</script>

<section
	class="mb-8 max-w-3xl space-y-4 rounded border border-neutral-200 p-4 dark:border-neutral-800"
	aria-labelledby="photo-heading"
>
	<h2 id="photo-heading" class="font-medium text-neutral-900 dark:text-neutral-100">Photo</h2>
	{#if message}<FormMessage kind="success" text={message} />{/if}
	{#if error}<FormMessage kind="error" text={error} />{/if}

	<div class="flex items-center gap-4">
		{#if photoUrl}
			<img
				src={photoUrl}
				alt="Current profile"
				referrerpolicy="no-referrer"
				class="h-24 w-24 rounded-full object-cover"
			/>
		{:else}
			<p class="text-sm text-neutral-500">No photo</p>
		{/if}
		{#if photoUrl}
			<form method="POST" action="?/removePhoto" use:enhance={busy}>
				<button disabled={pending} class="text-sm text-red-500 hover:text-red-700"
					>Remove photo</button
				>
			</form>
		{/if}
	</div>

	<form
		bind:this={uploadForm}
		method="POST"
		action="?/uploadPhoto"
		enctype="multipart/form-data"
		class="space-y-2"
		use:enhance={busy}
	>
		<!-- The native input stays (keyboard-focusable, submitted with the form) but hidden; its
		     label is the visible button. Not `disabled` while uploading: a disabled input is left
		     out of the submitted form — the label is blocked instead. -->
		<input
			bind:this={fileInput}
			id="photo"
			name="photo"
			type="file"
			accept="image/*"
			class="peer sr-only"
			onchange={onChoose}
		/>
		<label
			for="photo"
			aria-disabled={pending}
			class={[
				chooseButton,
				'peer-focus-visible:ring-2 peer-focus-visible:ring-neutral-400',
				pending && 'pointer-events-none opacity-50'
			]}>{uploading ? `Uploading ${uploading}…` : 'Choose image…'}</label
		>
		{#if tooLarge}
			<FormMessage kind="error" text="{tooLarge} is larger than 10 MB. Choose a smaller image." />
		{/if}
		<p class={hint}>
			Any image up to 10 MB; choosing one replaces the current photo. It is scaled to 256×256 and
			cropped to a square.
		</p>
	</form>

	<form method="POST" action="?/setPhotoUrl" class="space-y-1" use:enhance={busy}>
		<label for="photoUrl" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
			>…or use an image URL</label
		>
		<div class="flex flex-wrap items-center gap-2">
			<input
				id="photoUrl"
				name="photoUrl"
				placeholder="https://…"
				value={urlValue ?? (uploaded ? '' : (photoUrl ?? ''))}
				class={['min-w-0 flex-1', input]}
			/>
			<SubmitButton {pending} label="Use URL" />
		</div>
		<p class={hint}>https only, shown as-is (not resized), so link a small image (≈256 px).</p>
	</form>
</section>
