# COMP4020 prototype

Your starter repo for a COMP4020 prototype: a static site in HTML/CSS/TypeScript
that builds to plain HTML/CSS/JS and deploys to GitHub Pages. The deployed site
is what gets marked, not this repo.

The
[course website](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/)
publishes this deliverable's brief and spec, and this repo's name tells you
which deliverable applies. Read both before you plan or build.

## How to work in here

- Keep the dev server running (`pnpm dev`) so you see changes as you make them.
- Run `pnpm check` before you push.
- Open the page in a browser and look at it. The rendered page is the truth;
  your mental model of it isn't.
- When a check fails, read its output before you change anything.
- Never commit a red state.

## The link-preview card

`public/card.png` (1200x630) is the image a shared link shows; `index.html`'s
head points at it. Replace it and the `description` meta, and copy the head
block into any new page. The card URL resolves against the page that names it,
like any link --- `./card.png` is wrong one directory down, and nothing in CI
checks it, so the deployed head is the only place a broken one shows up.

## The checks

`pnpm check` runs them, and `pnpm check:evidence` is the extra gate before you
ship. CI runs the same plus links, secrets and the deploy.

`spec/README.md`, `PROCESS.md` and `reflections/README.md` are in this repo and
say what they are for.

## Accessibility lessons (from axe-core + manual review)

- **`opacity` for de-emphasis composites onto text and can fail contrast.** A
  muted 12px label at 0.4 opacity can measure well under 4.5:1. Use
  `filter: saturate()` instead, which removes the colour cue and leaves
  luminance alone. Content that's merely inactive is still worth reading;
  genuinely inapplicable content gets `hidden`, not a fade.
- **`overflow-x` creates a scrollable region that needs a tab stop.** Any strip
  that scrolls sideways with no focusable content inside it is unreachable by
  keyboard. Give read-only scrollable regions `tabIndex={0}` with a
  `role`/`aria-label`.
- **Cap ramp/colour-scale poles so cell text always clears 4.5:1** against a
  single fixed ink colour, rather than flipping text colour past a lightness
  threshold --- a light-on-dark flip usually leaves a gap where nothing is
  compliant.
- **Text should not carry an identity hue on its own.** Hues picked for 3:1 as
  marks/swatches often fail as 12px text (~3.6:1). Keep identity in a border or
  swatch; keep label text in a neutral ink token.
- Put colour/size/duration literals in one place (CSS custom properties), not
  scattered through component code --- it's the only way the rules above stay
  checkable by eye.

## CSS motion gotchas (Chrome-specific)

For whenever `position: sticky` or `animation-timeline` (scroll-driven
animation) come up:

- **The minifier can fold `animation-timeline` into the `animation`
  shorthand**, producing a value the shorthand doesn't accept --- Chrome then
  discards the whole declaration silently. Use longhands, and put the timeline
  rule in its own selector.
- **The blanket `prefers-reduced-motion` rule (`animation-duration: 0.01ms`)
  cannot reach a scroll-driven animation** --- its progress is scroll position,
  not duration. It has to be switched off by name.
- **Never transform a sticky element.** It's clamped to its containing block,
  and a transform is applied after that clamp, so a transformed sticky element
  can escape its intended container.

**Opacity may be animated, never rested on.** A value below 1 should only be
the `initial` or `exit` state of a transition that ends at 1 or at unmount.
For resting de-emphasis use `filter: saturate()` instead.

## This file is yours

A starting point, not a rulebook: what you add to it is the harness, and the
harness is assessed. This file and the sensors you wire into `check` carry
across the course --- both come with you into next week's repo. The prototype
doesn't: source, and the tests answering this week's published spec, stay
behind. `spec/README.md` draws the line.
