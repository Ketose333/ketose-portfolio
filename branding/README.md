# Branding

This directory is the shared branding workspace for the portfolio monorepo.

Use it for decisions that should outlive a single app implementation:

- brand context and design principles
- portfolio/site positioning
- UI copy and decorative-text rules
- color, typography, motion, and layout direction
- screenshots or notes that help future collaborators understand the intended taste

## Canonical Files

- `brand-context.md`
  - high-level project personality, audience, visual direction, and app-specific guidance
- `ui-copy-guardrails.md`
- `site-direction.md`
  - current direction for the public portfolio site
- `theme-principles.md`
  - confirmed dark-mode foundation and color/motion rules

Repo-local docs can point here, but the working source of truth should live in this folder when a document is about branding rather than implementation.

## Current Baseline


- All live surfaces are dark-mode-first.
- Shared surfaces should use repository theme tokens before app-local styling.
- Decorative copy is not allowed unless it explains a real action, state, rule, or link.
- Site is an accessible work index with restrained web-tech demonstrations, not a synthetic landing page.
- Long-term visual direction is industrial neo-brutalism with Nothing-inspired signal design.

If a change needs a new color, new motion pattern, new persistent HUD block, or new slogan-like phrase, update the relevant branding file first.

## Visual Language Shortcut

Current flat UI is the foundation, not the final personality.

- Keep the flat base for readability, performance, and layout discipline.
- Add neo-brutalism through hard structure, visible borders, direct hierarchy, and honest controls.
- Add Nothing influence through exposed layers, narrow palette, monochrome restraint, and signal-like interactive details.
- Do not copy Nothing's product UI literally. Borrow the logic: recognizable structure, functional glyph-like signals, and deliberate restraint.
