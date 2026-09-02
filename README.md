# ATB Financial — External Cyber Risk Assessment (React port)

Pixel-parity React + TypeScript + Vite conversion of the original static HTML/CSS/JS page.

## Stack
- React 19 + TypeScript
- Vite
- Tailwind CSS v4 (via `@tailwindcss/postcss`)
- Framer Motion (`useInView` drives the count-up numbers and the malware-share bar fills)

## Run locally

```bash
npm install
npm run dev       # http://localhost:5173
npm run build      # production build -> dist/
npm run preview    # serve the production build locally
```

## What was ported 1:1
- Sticky topbar with scrollspy-driven active nav link + mobile slide-down menu
- Hero with animated compromised-machines counter
- Summary bullets + animated stat grid
- Spotlight panel with sortable compromised-URL table (click a header to sort)
- 5-year SVG bar chart with hover tooltip (users vs employees)
- Filterable findings list (All / Critical / V.High / High / Medium)
- Password-strength donut charts (built from the same conic-gradient segment math)
- Employee AV hygiene bar
- Infostealer family breakdown with scroll-triggered width animation
- Six "classified" locked cards that flip to unlocked (staggered) after the form submits
- Unlock form with email validation, success state, and a re-triggerable "pulse" attention
  animation on the box when "Unlock Full Report" is clicked
- Footer

Everything currently lives in a single `src/App.tsx` (Phase 1, per the brief) with the
original CSS carried over verbatim in `src/App.css` for exact visual fidelity.
