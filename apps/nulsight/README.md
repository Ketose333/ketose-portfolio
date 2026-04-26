# NULSIGHT

`NULSIGHT` lives inside the portfolio monorepo as a single React/Vite surface with bundled browser/runtime assets.

## Read This First

- `docs/structure.md`
- `docs/rules.md`
- root `docs/project-guide.md`
- root `branding/ui-copy-guardrails.md`

If you are joining mid-stream, treat `lib/auth-service.js` and `lib/storage-config.js` as the app-local entry points for server concerns.

## Directory roles

- `src/`
  - current React app, route shell, page surfaces, client state
- `src/shared/`
  - gameplay constants and shared card data source
- `src/client/globals/`, `src/client/game/`, `src/client/audio/`
  - TypeScript sources that are bundled into browser globals under `public/js`
  - React `/game` also uses `src/client/game/runtimeBridges.ts` to install the small globals it still needs without extra script tags
  - page-level HUD and surface defaults now live in `src/client/game/surfaceState.ts`, and bridge-only runtime helpers live under `src/client/game/runtime/`
  - `src/client/game/runtime/gameRuntime.js` is the source for the generated `public/js/game.js` runtime
- `src/server/generated/`
  - Node-friendly generated entry points bundled into `lib/generated`
- `public/`
  - deploy-time static assets, CSS, generated browser globals, audio
- `src/styles/`
  - React route styles for shared shell, guide, deck, and deck hub surfaces
- `lib/auth-service.js`, `lib/storage-config.js`
  - thin NULSIGHT-specific wrappers over shared server packages for account/session and KV namespace configuration
- `lib/deck-store.js`, `lib/deck-hub-store.js`, `lib/store.js`
  - game-specific persistence layers that sit on top of the shared storage wrapper
- `public/game.css`
  - duel runtime stylesheet loaded only by the React `/game` route
- `docs/`
  - human-facing rules and structure notes
- `dist-check/`
  - ignored local verification build output used for screenshot audits

## Build flow

- `npm run build`
  - builds shared palette/theme assets, generated browser/server bundles, then the production Vite app
- `npm run build:verify`
  - same pipeline, but writes the Vite app to `dist-check/` for local Playwright overlay checks

## Working Notes

- Prefer moving reusable server concerns into `packages/` before adding more app-local helpers.
- Keep runtime compatibility comments when touching persistence, because KV keys still read legacy aliases during migration.
- Remove old paths only after confirming both the app build and the Playwright audit pass.
- Destructive maintenance endpoints such as global room/deck clears should stay gated behind `PORTFOLIO_MAINTENANCE_TOKEN`; they are not meant to be available to ordinary authenticated players.

## Shared assets

- neutral theme source: `themes/theme.oklch.css`
- local palette source: `apps/nulsight/public/palette.oklch.css`
- audio assets: `apps/nulsight/public/audio/bgm`, `apps/nulsight/public/audio/sfx`
