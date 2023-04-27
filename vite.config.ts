import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		globals: true,
		include: ['src/**/*.{test,spec}.{js,ts}', 'tests/*.{test,spec}.{js,ts,mjs}'],
		coverage: {
			provider: 'c8',
			reporter: ['text', 'json', 'html'],
		}
	}
});
