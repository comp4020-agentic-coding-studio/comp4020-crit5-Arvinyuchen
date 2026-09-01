# Process overview

## What I built

A Pac-Man-style maze chase: a procedurally generated maze about 40% bigger
than classic Pac-Man's, four ghosts that do real shortest-path chase (not
random wandering), and power pellets that turn them frightened and eatable.
Controls are WASD only. There's no lives system and no tutorial anywhere on
or off screen — you're dropped straight into the maze, and one ghost touch
ends the run.

## The moments that mattered

1. **A bigger maze fights the "ends in five minutes" requirement.** The spec
   asks that a stranger reach an ending — win, loss, or finish — inside five
   minutes, but I wanted a maze noticeably bigger than classic Pac-Man's,
   which means a full clear (the win condition) realistically takes much
   longer than that. Instead of shrinking the maze back down, I kept it big
   and pushed the tuning onto the ghosts: real BFS chase, no scatter phase,
   all four hunting — so a first-time player's realistic five-minute ending
   is a loss, not a slow win. I confirmed it browser-playtesting after
   building: the first attempts died in a couple of seconds
   ([`a039be7`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-Arvinyuchen/commit/a039be7)),
   which was actually too aggressive — see moment 3.

2. **The scaffolded contract test had a module-caching bug, before any game
   code existed.** `spec/crit-5.test.ts` originally did
   `await import("../main")` inside `beforeEach` to get a fresh game per
   test. ES module imports are cached, so the second test in the file would
   silently reuse the first test's already-initialized state instead of
   re-running it — a false-negative-proof test that looks green either way.
   Rather than patch the test around that later, I designed `src/game.ts`'s
   `initGame(container)` as an exported factory from the start (not
   import-time side effects), so each test can call it fresh against its own
   container. Verified by `pnpm check`: both crit-5 tests pass independently
   against separate instances
   ([`9f6390f`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-Arvinyuchen/commit/9f6390f)
   built the factory,
   [`d76bb83`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-Arvinyuchen/commit/d76bb83)
   rewrote the test to use it).

3. **Playtesting caught what the plan couldn't predict.** Once the game was
   playable, ghosts caught the player almost instantly and the canvas sat
   small and top-left in a big browser window instead of filling it. Rather
   than either simplifying the ghost AI or hardcoding new pixel sizes, I
   added two independent knobs — ghosts move at half the player's speed and
   leave the ghost house staggered instead of all four hunting from tick
   one — and made the canvas a responsive replaced element
   (`width`/`height: auto` with viewport-relative `max-width`/`max-height`)
   so it scales and centers at any window size. Checked by resizing the
   browser to three different window sizes and reading the canvas's actual
   `getBoundingClientRect()` at each to confirm it stayed centered with room
   left for the HUD
   ([`96cef72...340d4a9`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-Arvinyuchen/compare/96cef72...340d4a9)).
