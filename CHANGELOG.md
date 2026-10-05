# Puzzle Idle — Change Log

## Reorganization & hygiene
- Removed dead `src/index.js`; split the 590-line `main.js` into topical modules: `state.js`, `economy.js`, `image.js`, `particles.js`, `piece.js`, `puzzle.js`, `render.js`, `board.js`, `ui.js`, `input.js`, `save.js`, `audio.js`, `stats.js`, `modal.js`, `tutorial.js`, `main.js`.
- Added ESLint (flat config) + `npm run lint` / `lint:fix`; fixed all errors (0 warnings now).
- Removed stale comments/formatting noise; deduplicated piece-path tracing into `tracePiecePath`.

## Bug fixes
- `prefer-const` had broken shared `let` globals in `state.js` → restored.
- Scramble no longer uses hardcoded `240x220` exclusion; measures `#ui-overlay` at runtime.
- Auto-placers stalling: fixed `prefer-const`-adjacent state + excluded the held piece from the launch pool; topped up the strategy pool so all placers fire each tick.
- `updateHTML_UI` rename to `updateUI`; prestige displays now sync.
- Multiple image loading/loading races fixed (handlers before `src`, reuse in-flight, no blank gaps, willReadFrequently).
- Modal stacking on repeated Enter presses prevented.
- Reset Save blocked the unload autosave from re-saving over the deletion.
- Buying rows/cols / size changes no longer give Head Start repeatedly (per completion only).
- Sections auto-placer: fixed String/number sectionId mismatch (was launching 0 pieces), k-means bucketization, flood-fill contiguous sections, neighbor smoothing, locked section until finished.
- Skin buttons/achievements list no longer rebuild on every tick (hover flicker + lost clicks).
- Mute/unmute: `sfxMuted`/`musicMuted` separated; unmute no longer restarts the track.
- Challenge Start button hover flicker fixed via list re-render guard.
- Headstart currency exploit on resize/upgrade fixed.

## Gameplay tweaks from galaxy.click feedback
- Auto-placer speed now also increases piece flight speed (`easeSpeed` +30%/level, Swift +15%/level).
- Prestige upgrade costs now linear per level instead of doubling each level.
- Prestige gain: flat to 15x15 then `+0.5%/cell` (`1.005^(cells-225)`), no wallet bonus baked in anymore (only via `currency/1000`).
- Challenge targets scale with max-board size (`floor(maxCells/500)` multiplier).
- Achievements only pay out after the first prestige; reward lowered 50 → 5 Shards each later.

## Features
- Offline progress via `localStorage` + auto-placer simulation on boot and when tab was hidden.
- Auto-placer strategies: Random / Edges / Corners / Sections (color-based, locked per section).
- Prestige upgrades: Snap Assist, Head Start, Swift Placers, Shard Bonus, Discount, Token Mastery, Guide Overlay (preview image), plus one-time Guide Overlay.
- Board skins (Midnight/Forest/Sunset/Ocean) swappable with Shards.
- Theme-matched size/volume controls, themed tooltips (fixed `#tooltip` element), themed modal dialogs replacing native alert/confirm.
- Achievements (+5 Shards each), stats panel (fastest completion, lifetime pieces, etc.), run log (per-prestige run history), daily bonus, Challenges with timed runs and permanent buffs.
- Buy amount toggle (x1 / x10 / Max) anchored beside the panel.
- Tutorial walkthrough on first load + one-time popup tips (prestige / challenges unlock).

## infra
- `npm run build` obfuscates `src/` into `dist/` (strings array, base64, self-defending, globals renamed = false, onclick names preserved).
- GitHub Actions workflow deploys `dist/` to GitHub Pages on push to master.
