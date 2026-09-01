# Crit 5 reflection

**The breakthrough** was realizing the maze-size decision and the "ends in
five minutes" spec line weren't actually in conflict — they only looked that
way if I assumed the ending had to be a win. Once I let the ghosts, not the
maze, carry the five-minute constraint, I could build the bigger maze I
wanted without quietly violating the spec. That reframing came before any
code, during planning, and it's the kind of call that's easy to miss if you
treat a spec line as a checkbox instead of a property the whole design has to
satisfy together.

**What this changed** is how much I trust a first playtest over my own
prediction of how a design will feel. I designed the ghost AI on paper as
"aggressive enough to lose fast" and was confident in that number until I
actually played it and died in two seconds flat, several times in a row —
too aggressive to even register as a game. The fix wasn't to abandon the
design, it was to add tunable knobs (ghost speed, staggered release) and
adjust them against what I actually saw happen, rather than what I'd
reasoned should happen. I want to keep building that habit: treat my own
design intuition as a first draft that a real run of the thing is allowed to
overrule, not as the answer I then go looking for evidence to confirm.
