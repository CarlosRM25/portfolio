// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Production URL — drives canonical + Open Graph tags.
  // Swap this if a custom domain is added later.
  site: 'https://portfolio-liart-rho-94.vercel.app',
  output: 'static',

  vite: {
    plugins: [tailwindcss()],
  },
});
