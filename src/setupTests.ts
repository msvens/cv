// Adds @testing-library/jest-dom matchers (toBeInTheDocument, etc.) to Vitest.
import '@testing-library/jest-dom/vitest';
// Unmounts rendered components after each test. The svelteTesting() plugin would add this
// itself, but only to the root config's setupFiles, which this project's own list replaces.
import '@testing-library/svelte/vitest';
