/**
 * Generates public/og.png — the 1200×630 social share card.
 *
 * Run after changing the name / tagline / palette:  npm run og
 * Requires the `sharp` dev dependency (SVG → PNG rasteriser).
 */
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "../public/og.png");

// Keep in sync with src/data/profile.ts / src/styles/global.css.
const NAME = "Carlos Rubio-Marroquin";
const TAGLINE = [
  "Data science student turning analysis into decisions —",
  "Python, SQL, and a bias for communicating clearly.",
];
const FOOTER = "Data Science · University of Washington";

const C = {
  canvas: "#17130f",
  heading: "#f6f1ee",
  muted: "#a79c94",
  faint: "#948881",
  accent: "#e0653a",
  accentInk: "#1a1410",
};

const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="82%" cy="14%" r="55%">
      <stop offset="0%" stop-color="${C.accent}" stop-opacity="0.22" />
      <stop offset="100%" stop-color="${C.accent}" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="${C.canvas}" />
  <rect width="1200" height="630" fill="url(#glow)" />

  <!-- monogram -->
  <rect x="80" y="80" width="64" height="64" rx="16" fill="${C.accent}" />
  <text x="112" y="122" text-anchor="middle" font-family="${FONT}"
        font-size="32" font-weight="600" letter-spacing="-1.5" fill="${C.accentInk}">cr</text>

  <!-- accent bar -->
  <rect x="82" y="300" width="56" height="4" rx="2" fill="${C.accent}" />

  <!-- name -->
  <text x="80" y="250" font-family="${FONT}" font-size="76" font-weight="600"
        letter-spacing="-2" fill="${C.heading}">${NAME}</text>

  <!-- tagline -->
  <text x="80" y="368" font-family="${FONT}" font-size="33" fill="${C.muted}">${TAGLINE[0]}</text>
  <text x="80" y="414" font-family="${FONT}" font-size="33" fill="${C.muted}">${TAGLINE[1]}</text>

  <!-- footer -->
  <text x="80" y="545" font-family="${FONT}" font-size="24" font-weight="500" fill="${C.faint}">${FOOTER}</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(OUT);
console.log(`wrote ${path.relative(process.cwd(), OUT)}`);
