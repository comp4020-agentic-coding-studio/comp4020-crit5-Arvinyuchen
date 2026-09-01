// Pure grid pathfinding, shared by ghosts chasing (shortest step toward the
// player) and fleeing (step toward whichever open neighbor is farthest from
// the player). The maze is ~1200 tiles, so a fresh BFS every tick is cheap.
import type { Grid, Point } from "./maze";

const DIRS = [
  { x: 0, y: -1 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
];

function key(p: Point): string {
  return `${p.x},${p.y}`;
}

function openNeighbors(grid: Grid, p: Point): Point[] {
  const height = grid.length;
  const width = grid[0].length;
  return DIRS.map(({ x, y }) => ({ x: p.x + x, y: p.y + y })).filter(
    (n) => n.x >= 0 && n.x < width && n.y >= 0 && n.y < height && grid[n.y][n.x] === 1,
  );
}

/** BFS distance from `from` to every reachable tile. */
export function distanceField(grid: Grid, from: Point): Map<string, number> {
  const dist = new Map<string, number>([[key(from), 0]]);
  const queue: Point[] = [from];
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    const d = dist.get(key(cur))!;
    for (const next of openNeighbors(grid, cur)) {
      const nk = key(next);
      if (dist.has(nk)) continue;
      dist.set(nk, d + 1);
      queue.push(next);
    }
  }
  return dist;
}

/** The first step from `from` on a shortest path to `to`, or null if `from`
 *  is already `to` or `to` is unreachable. */
export function nextStepToward(grid: Grid, from: Point, to: Point): Point | null {
  if (from.x === to.x && from.y === to.y) return null;
  const dist = distanceField(grid, to);
  if (!dist.has(key(from))) return null;

  let best: Point | null = null;
  let bestDist = Infinity;
  for (const n of openNeighbors(grid, from)) {
    const d = dist.get(key(n));
    if (d !== undefined && d < bestDist) {
      bestDist = d;
      best = n;
    }
  }
  return best;
}

/** The open neighbor of `from` that maximizes distance from `avoid` — used by
 *  frightened ghosts fleeing the player. Falls back to any open neighbor if
 *  every direction is equally (un)safe. */
export function stepAwayFrom(grid: Grid, from: Point, avoid: Point): Point | null {
  const dist = distanceField(grid, avoid);
  const neighbors = openNeighbors(grid, from);
  if (neighbors.length === 0) return null;

  let best = neighbors[0];
  let bestDist = dist.get(key(best)) ?? -1;
  for (const n of neighbors.slice(1)) {
    const d = dist.get(key(n)) ?? -1;
    if (d > bestDist) {
      bestDist = d;
      best = n;
    }
  }
  return best;
}
