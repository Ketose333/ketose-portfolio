# Theme Principles

## Confirmed Foundation

All public pages and app surfaces are dark-mode-first.

This is not a temporary implementation detail. Site and NULSIGHT should assume a dark foundation unless a future brand decision explicitly changes this file.

## Dark-Mode Rules

- `color-scheme: dark` is the default for shared theme tokens.
- Do not add a light-mode variant by default.
- Do not introduce bright page backgrounds for marketing contrast.
- Use depth, borders, spacing, and typography before adding accent color.
- White or near-white text is reserved for primary reading hierarchy.
- Muted text should stay readable on dark panels and must not become decorative noise.
- Panels should be distinguishable by border, elevation, and opacity, not by unrelated accent colors.

## Surface Tiers

Use these tiers before inventing new visual treatments:

- Page background: the quietest dark layer.
- Shell or route frame: separates an app/page from browser chrome.
- Panel: default readable content block.
- Strong panel or overlay: modal, result, selection, or blocking state.
- Interactive control: button, tab, link, input, or selectable card.
- Feedback state: selected, disabled, error, success, warning, loading.

If a surface does not fit one of these tiers, it is probably decorative or should be expressed through an existing tier.

## Shape Rules

- Default to square or nearly square surfaces.
- Panels, cards, overlays, and route frames should avoid soft rounded styling.
- Buttons, inputs, and tiny chips may use a small radius only when it improves touch feel or focus recognition.
- Do not mix many radius values on one screen.
- If a corner is rounded, it should feel engineered, not soft or cute.

## Accent Color Rules

- Shared surfaces should use `themes/theme.*` tokens first.
- App-specific accent colors are allowed only when they support app identity or game readability.
- Site-specific accent colors require a note in `site-direction.md`.
- The shared brand palette is `#C8D0D3`, `#735587`, and `#91EDFC`; source CSS must use their OKLCH token forms.
- Avoid arbitrary teal, gold, purple, or blue accents unless the branding docs explain the role.
- A color that exists only because it "looks nice" should be removed.
- Current site baseline: use the shared palette only; do not add a fourth signature color.
- NULSIGHT may use app-local state colors only for duel clarity: ownership, selection, legality, damage, warning, or success.

## Shared Brand Tokens

- `--theme-brand-mist`: `#C8D0D3`, quiet text and structural contrast.
- `--theme-brand-violet`: `#735587`, restrained atmospheric accent.
- `--theme-brand-cyan`: `#91EDFC`, high-signal interaction and focus accent.

## Style Application

Use the palette through this hierarchy:

- Mist is the default readable material: text, borders, quiet dividers, inactive labels.
- Violet is the atmospheric material: washes, depth, subdued brand mood, inactive decorative structure.
- Cyan is the signal material: focus, active state, selected project, current route, meaningful highlights.

Do not use cyan as general decoration. If many things glow cyan, nothing is a signal.

## App Color Exceptions

- site: shared three-color palette only.
- NULSIGHT: duel state colors may go outside the shared palette for legality, ownership, damage, warning, success, selection, and chain/stack clarity.
- Any exception outside these cases should be documented before implementation.

## Neo-Brutal / Nothing Layering

Current flat design is the implementation base.

Add long-term character through:

- square or minimally rounded panels
- visible borders and seams
- deliberate grid exposure
- large but controlled typography
- black-forward surfaces with mist/cyan contrast
- transparent or layered panel logic when it reveals real structure

Do not add:

- chaotic spacing
- unreadable contrast
- novelty cursors
- fake hardware graphics
- decorative dot grids without state meaning

## Glyph And Signal Rules

- Dots, glyphs, ticks, bars, and circuit-like marks must represent state, selection, route, loading, focus, or progress.
- Decorative glyphs with no state meaning should be removed.
- Repeated signal marks should be sparse enough that the active state remains obvious.

## Motion Rules

- Motion should demonstrate interaction, state change, or game feedback.
- Decorative idle motion is not part of the brand baseline.
- Reduced-motion mode should preserve the same information hierarchy.
- Site motion should prove front-end craft without becoming the content.
- Game motion belongs mainly to play feedback, overlays, transitions, or selected states.

## Open Decisions

- Whether NULSIGHT should expose app-local accent tokens in a shared naming scheme.
- Whether long-form portfolio documents need a print-friendly or light document theme outside the live sites.
