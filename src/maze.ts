// A ~1200-tile maze is too large to hand-author as ASCII art and guarantee
// every dot is reachable, so it's generated: a seeded recursive backtracker
// carves a spanning tree (guaranteeing full connectivity), then a loop pass
// knocks out a few more walls so the maze isn't a strict tree — a tree maze
// has exactly one path between any two tiles, which corners a chased player
// immediately. The seed is fixed, so the layout is deterministic, not random
// per load.

export type Tile = 0 | 1; // 0 = wall, 1 = path
export type Grid = Tile[][]; // grid[y][x]

export interface Point {
  x: number;
  y: number;
}

export interface MazeData {
  grid: Grid;
  width: number;
  height: number;
  dots: Point[];
  pellets: Point[];
  playerSpawn: Point;
  ghostHome: Point[];
}

const CELL_COLS = 19;
const CELL_ROWS = 15;
const LOOP_CHANCE = 0.12;
const DEFAULT_SEED = 20260902;

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const CELL_DIRS = [
  { dx: 0, dy: -1 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: 1, dy: 0 },
];

export function generateMaze(seed: number = DEFAULT_SEED): MazeData {
  const rng = mulberry32(seed);
  const width = CELL_COLS * 2 + 1;
  const height = CELL_ROWS * 2 + 1;
  const grid: Grid = Array.from({ length: height }, () => Array<Tile>(width).fill(0));

  const tileOf = (cx: number, cy: number): Point => ({ x: cx * 2 + 1, y: cy * 2 + 1 });
  const carve = (x: number, y: number): void => {
    grid[y][x] = 1;
  };

  // Spanning tree over maze cells (recursive backtracker, iterative stack).
  const visited: boolean[][] = Array.from({ length: CELL_ROWS }, () => Array<boolean>(CELL_COLS).fill(false));
  const stack: Point[] = [{ x: 0, y: 0 }];
  visited[0][0] = true;
  const start = tileOf(0, 0);
  carve(start.x, start.y);

  while (stack.length > 0) {
    const cur = stack[stack.length - 1];
    const candidates = shuffle(CELL_DIRS, rng)
      .map(({ dx, dy }) => ({ x: cur.x + dx, y: cur.y + dy }))
      .filter((p) => p.x >= 0 && p.x < CELL_COLS && p.y >= 0 && p.y < CELL_ROWS && !visited[p.y][p.x]);

    if (candidates.length === 0) {
      stack.pop();
      continue;
    }

    const next = candidates[0];
    visited[next.y][next.x] = true;
    // The wall between cur and next sits at the midpoint of their tile coords.
    const curTile = tileOf(cur.x, cur.y);
    const nextTile = tileOf(next.x, next.y);
    carve((curTile.x + nextTile.x) / 2, (curTile.y + nextTile.y) / 2);
    carve(nextTile.x, nextTile.y);
    stack.push(next);
  }

  // Loop pass: reopen some already-adjacent, already-carved cell pairs so the
  // maze has more than one route between two points.
  for (let cy = 0; cy < CELL_ROWS; cy++) {
    for (let cx = 0; cx < CELL_COLS; cx++) {
      for (const { dx, dy } of [{ dx: 1, dy: 0 }, { dx: 0, dy: 1 }]) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx >= CELL_COLS || ny >= CELL_ROWS) continue;
        const aTile = tileOf(cx, cy);
        const bTile = tileOf(nx, ny);
        const midX = (aTile.x + bTile.x) / 2;
        const midY = (aTile.y + bTile.y) / 2;
        if (grid[midY][midX] === 0 && rng() < LOOP_CHANCE) {
          grid[midY][midX] = 1;
        }
      }
    }
  }

  // Ghost house: a small room in the center. Only ever turns walls into
  // paths, so it can't disconnect anything the spanning tree already joined.
  const centerTile = tileOf(Math.floor(CELL_COLS / 2), Math.floor(CELL_ROWS / 2));
  const houseMinX = centerTile.x - 2;
  const houseMaxX = centerTile.x + 2;
  const houseMinY = centerTile.y - 1;
  const houseMaxY = centerTile.y + 1;
  for (let y = houseMinY; y <= houseMaxY; y++) {
    for (let x = houseMinX; x <= houseMaxX; x++) {
      grid[y][x] = 1;
    }
  }
  const ghostHome: Point[] = [
    { x: centerTile.x - 2, y: centerTile.y },
    { x: centerTile.x - 1, y: centerTile.y },
    { x: centerTile.x + 1, y: centerTile.y },
    { x: centerTile.x + 2, y: centerTile.y },
  ];

  // Player spawns bottom-middle, well clear of the ghost house and the four
  // corner tiles reserved for power pellets.
  const playerSpawn = tileOf(Math.floor(CELL_COLS / 2), CELL_ROWS - 1);

  const pellets: Point[] = [
    tileOf(0, 0),
    tileOf(CELL_COLS - 1, 0),
    tileOf(0, CELL_ROWS - 1),
    tileOf(CELL_COLS - 1, CELL_ROWS - 1),
  ];
  const pelletKeys = new Set(pellets.map((p) => `${p.x},${p.y}`));
  const houseKeys = new Set<string>();
  for (let y = houseMinY; y <= houseMaxY; y++) {
    for (let x = houseMinX; x <= houseMaxX; x++) houseKeys.add(`${x},${y}`);
  }
  const spawnKey = `${playerSpawn.x},${playerSpawn.y}`;

  const dots: Point[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x] !== 1) continue;
      const key = `${x},${y}`;
      if (pelletKeys.has(key) || houseKeys.has(key) || key === spawnKey) continue;
      dots.push({ x, y });
    }
  }

  return { grid, width, height, dots, pellets, playerSpawn, ghostHome };
}
