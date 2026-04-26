# NULSIGHT Structure Notes

## Runtime surface

`NULSIGHT` now ships one user-facing web surface: the React/Vite app.

- Vercel routes all non-API requests to `index.html`.
- The old `public/legacy/` fallback pages are retired.
- React `/game` still mounts `public/js/game.js`, but the small globals it needs are installed from `src/client/game/runtimeBridges.ts`.
- Game-facing page defaults live in `src/client/game/surfaceState.ts`, while bridge-side termbook/view/card-render rules live in `src/client/game/runtime/`.
- `public/js/game.js` is now a generated browser bundle built from `src/client/game/runtime/gameRuntime.js`.
- server auth/storage primitives now live in workspace packages; `lib/auth-service.js` and `lib/storage-config.js` are just app-local configuration wrappers.
- React route styles now live in `src/styles/`; only duel runtime assets remain under `public/`.

## Why `dist-check` exists

`dist-check/` is an ignored local-only verification build.

- It is used by local Playwright overlay scripts to compare the current build against the live deployment.
- It should never be treated as a source directory.
- Refresh it with `npm run build:verify`.

## Source of truth

- card data and rule constants start in `src/shared/`
- browser globals that are still needed at runtime are emitted to `public/js/`
- server-friendly generated bundles are emitted to `lib/generated/`
- shared server auth/storage helpers live in `packages/server-auth` and `packages/server-storage`
- React routes read `src/styles/core.css`

This split still supports:

- React/Vite pages
- API runtime imports
- local verification overlays

## UI alignment

- YGOPRO is a reference for TCG client vocabulary and feedback structure: field zones, hand, grave, banish, selectable cards, selected cards, and chain/stack prompts.
- NULSIGHT rules remain app-owned. Do not copy YGOPRO timing, card effects, or rule resolution into the runtime unless the NULSIGHT rules document is updated first.
- In-game React wrappers should keep moving toward small surfaces such as `GameStatusStrip`, `GameCommandBar`, and shared `OverlaySurface` usage.
- Copy decisions should follow root `branding/ui-copy-guardrails.md`; avoid adding status labels or atmospheric text that does not change a player decision.

## Cleanup rule

When touching structure, prefer this order:

1. remove dead CSS and unused component paths
2. remove retired public assets and route mappings in the same change
3. rename or move directories only after runtime references are gone
