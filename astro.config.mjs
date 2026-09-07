// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // TODO(Carlos): set to the real deployment URL after the first Vercel deploy
  // (used for canonical + Open Graph tags). Record the URL in CLAUDE.md too.
  site: 'https://carlos-rubio-marroquin.vercel.app',
  output: 'static',

  vite: {
    plugins: [tailwindcss()],
  },
});
