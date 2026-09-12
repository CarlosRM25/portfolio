// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Production URL — drives canonical + Open Graph tags.
  // Custom domain, live since 2026-09-09. The old portfolio-liart-rho-94.vercel.app
  // still resolves but 307-redirects here, so this must stay the canonical origin.
  // If it ever changes again, also update CORS_ALLOWED_ORIGIN on the agent's
  // Cloud Run service or /demo's "ask your own" breaks (see CLAUDE.md).
  site: 'https://carlos-rubio-marroquin.com',
  output: 'static',

  vite: {
    plugins: [tailwindcss()],
  },
});
