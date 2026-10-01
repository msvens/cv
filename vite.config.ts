import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// Full-stack app (SSR, form actions, +server.ts endpoints): a long-running Node
			// server, unlike the static SPAs in chess/mphotos-svelte. Run with `node build`.
			adapter: adapter(),
			experimental: {
				// Env vars are declared in src/env.ts and imported from $app/env/private, so
				// their types don't depend on the local .env or shell. Default in SvelteKit 3,
				// which removes the $env/* modules this replaces.
				explicitEnvironmentVariables: true
			}
		}),
		// Renders Svelte components into jsdom for @testing-library/svelte tests
		// (resolve.conditions tweak + auto-cleanup between tests). Test-only.
		svelteTesting()
	],
	server: {
		// Same port the Next app used, so the dev URL and the nginx upstream are unchanged.
		port: 3004,
		strictPort: true
	},
	preview: {
		port: 3004,
		strictPort: true
	},
	test: {
		// Two environments: components render into jsdom; everything else (server code,
		// pure helpers) runs in plain Node so server-only modules behave as in production.
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					environment: 'jsdom',
					setupFiles: ['src/setupTests.ts'],
					include: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
