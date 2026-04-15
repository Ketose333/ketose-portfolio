# Portfolio Account Expansion

## Current State

- `nulsight` is the only app with a real account system today.
- `site` and `amesato` are public clients with no server-backed session API.
- Shared client helpers now live in `@portfolio/account-client`.
- Shared service metadata now lives in `@portfolio/services`.
- Shared server auth/storage primitives now live in `@portfolio/server-auth` and `@portfolio/server-storage`.

## What Blocks True Cross-Service Login

- The current deployments live on separate `*.vercel.app` hosts.
- Cookie sessions issued by `nulsight` are same-origin and cannot be relied on as a shared cross-app session layer.
- `site` and `amesato` do not expose `/api/auth` endpoints yet.
- `nulsight` is still the only app wiring those shared server primitives into a live auth API today.

## Safe Next Step

1. Move all services under one custom parent domain.
2. Introduce a dedicated auth origin such as `auth.<domain>`.
3. Make every app trust the same account backend.
4. Reuse `@portfolio/account-client` in all three apps with the shared auth base URL.

## Suggested Rollout

- Phase 1: keep `nulsight` as the auth source and use shared client/types only.
- Phase 2: add account-aware entry points to `site` and `amesato`.
- Phase 3: switch to central auth and shared cookie or token exchange after custom-domain migration.
