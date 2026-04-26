# Brand Context

## Project Scope

`ketose-portfolio` is a monorepo that hosts:

- `apps/site`: a public portfolio site
- `apps/nulsight`: a browser TCG with custom rules and an ongoing UX / duel-surface redesign

The portfolio should not feel like a generic developer landing page. It should feel like the work of a game-minded builder who cares about interaction quality, UI judgment, and shipping real projects.

## Target Audience

- Recruiters and interviewers who need to understand the work quickly
- Game/UI-minded engineers and designers evaluating taste and implementation quality
- Curious players who want to try the projects directly from the portfolio

## Primary Use Cases

- Understand what each project is, fast
- See what kind of problems were solved, not just what stack was used
- Jump into a playable build without hunting for links
- Recognize that UI/UX decisions are intentional, not template-driven

## Brand Personality

Three anchor words:

- precise
- atmospheric
- opinionated

The work should feel:

- design-literate, but not precious
- game-aware, but not noisy
- serious about craft, but not corporate

Avoid:

- startup landing-page tone
- generic design showcase vibes
- sterile SaaS dashboard aesthetics
- decorative copy that says little

## Minimum Decisions

These decisions are active until this folder is updated:

- The portfolio brand is dark, restrained, and project-led.
- The portfolio should be judged through usable work, not through a large personality splash screen.
- Site and NULSIGHT share a surface language, but each app keeps its own product mood.
- Interface quality means readable hierarchy, clear actions, and controlled density before visual novelty.
- New UI should look hand-directed: specific, explainable, and connected to the project, not made for spectacle.

## Long-Term Visual Language

The intended direction is industrial neo-brutalism with Nothing-inspired signal design.

This means:

- flat surfaces remain the base layer for clarity and implementation stability
- neo-brutalism adds blunt structure: visible borders, hard panels, strong typographic hierarchy, exposed layout mechanics
- Nothing influence adds restraint: narrow palette, monochrome-first surfaces, transparent/layered thinking, signal-like UI details
- the result should feel built, inspectable, and playable, not decorative or template-smooth

Borrow:

- exposed structure
- graphic recognizability
- useful signal systems
- confident negative space
- high-contrast interactive states

Avoid:

- faux terminal dashboards
- random pixel/dot decoration
- saturated neo-brutalist toy colors
- brutalism that harms readability
- copying Nothing's exact dot-matrix or glyph language without a project-specific function

## Visual Direction

- All live web surfaces are dark-mode-first. This is a confirmed brand foundation, not a temporary implementation default.
- Prefer strong hierarchy and clear structural contrast over ornamental flourishes.
- Use asymmetry and rhythm carefully, but keep interaction surfaces readable.
- Favor interfaces that feel intentional and tuned, not flashy by default.
- Shared surfaces should feel cohesive across apps, but each app can keep its own mood.
- Do not invent per-app accent colors unless the branding folder records why they exist.
- Refer to `theme-principles.md` before changing colors, brightness, contrast, or motion tone.
- Edges may become harder and panels more exposed over time, but usability remains the floor.

## Typography

- Body text should prioritize clarity and directness.
- Headlines can be expressive, but should not feel like marketing slogans unless the page is explicitly promotional.
- Avoid the default modern-tech monoculture look.

## Portfolio Site Guidance

- Lead with what is being built, not vague self-description.
- Emphasize project identity, current state, and why each project matters.
- Prefer concise, concrete copy over decorative framing.
- Treat the site as a project index with taste, not a personality splash page.
- Use shared theme tokens first; add site-only colors only when this directory defines the reason.
- Demonstrations are allowed when they show real web craft: interaction states, responsive composition, tasteful animation, or direct project previews.
- Do not add fake dashboards, fake terminal output, fake metrics, or abstract tech ornaments to make the page feel busier.

## NULSIGHT Guidance

- Play experience comes before attachment to legacy UI.
- Duel readability, state clarity, and interaction confidence matter more than decorative cleverness.
- Reference serious TCG interfaces, including YGOPRO, for structure and feedback, not for rules.
- Outgame surfaces should stay quiet and functional; ingame surfaces should feel like a real duel client.
- TCG readability takes priority over atmospheric framing: card text, legal actions, selection state, stack/chain state, and field ownership must be unmistakable.

## Copy Discipline

- Treat `ui-copy-guardrails.md` as the shared copy boundary for all three sites.
- Add text only when it improves navigation, action choice, feedback, or rules clarity.
- Prefer shorter Korean labels over decorative English labels when both mean the same thing.
- If a phrase causes Korean syllable-level wrapping on mobile, shorten the phrase before adding layout hacks.
