import type { Grid, Point } from "./maze";

export const CELL_SIZE = 18;
export type Direction = "up" | "down" | "left" | "right";

const WALL_COLOR = "#1a1a6e";
const PATH_COLOR = "#050510";
const DOT_COLOR = "#f5e6c8";
const PELLET_COLOR = "#ffd23f";
const PLAYER_COLOR = "#ffd23f";
const FRIGHTENED_COLOR = "#4d6bff";
const FRIGHTENED_FLASH_COLOR = "#ffffff";

interface GhostView {
  pos: Point;
  color: string;
  state: "normal" | "frightened" | "respawning";
}

export interface RenderView {
  grid: Grid;
  dots: Point[];
  pellets: Point[];
  player: { pos: Point; dir: Direction };
  ghosts: GhostView[];
  /** Whether the frightened effect is in its closing seconds — flashes
   *  between blue and white unless reduceMotion is set. */
  frightenedFlashing: boolean;
  reduceMotion: boolean;
}

function cellCenter(p: Point): { x: number; y: number } {
  return { x: p.x * CELL_SIZE + CELL_SIZE / 2, y: p.y * CELL_SIZE + CELL_SIZE / 2 };
}

function drawMaze(ctx: CanvasRenderingContext2D, grid: Grid): void {
  ctx.fillStyle = PATH_COLOR;
  ctx.fillRect(0, 0, grid[0].length * CELL_SIZE, grid.length * CELL_SIZE);
  ctx.fillStyle = WALL_COLOR;
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x] === 0) ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
  }
}

function drawDots(ctx: CanvasRenderingContext2D, dots: Point[]): void {
  ctx.fillStyle = DOT_COLOR;
  for (const dot of dots) {
    const { x, y } = cellCenter(dot);
    ctx.beginPath();
    ctx.arc(x, y, CELL_SIZE * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPellets(ctx: CanvasRenderingContext2D, pellets: Point[]): void {
  ctx.fillStyle = PELLET_COLOR;
  for (const pellet of pellets) {
    const { x, y } = cellCenter(pellet);
    ctx.beginPath();
    ctx.arc(x, y, CELL_SIZE * 0.32, 0, Math.PI * 2);
    ctx.fill();
  }
}

const FACING_ANGLE: Record<Direction, number> = {
  right: 0,
  down: Math.PI / 2,
  left: Math.PI,
  up: -Math.PI / 2,
};

function drawPlayer(ctx: CanvasRenderingContext2D, pos: Point, dir: Direction): void {
  const { x, y } = cellCenter(pos);
  const r = CELL_SIZE * 0.42;
  const facing = FACING_ANGLE[dir];
  const mouth = 0.24 * Math.PI;
  ctx.fillStyle = PLAYER_COLOR;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, r, facing + mouth, facing - mouth + Math.PI * 2);
  ctx.closePath();
  ctx.fill();
}

function drawGhost(ctx: CanvasRenderingContext2D, ghost: GhostView, flashWhite: boolean): void {
  const { x, y } = cellCenter(ghost.pos);
  const r = CELL_SIZE * 0.42;
  const color =
    ghost.state === "frightened" ? (flashWhite ? FRIGHTENED_FLASH_COLOR : FRIGHTENED_COLOR) : ghost.color;

  ctx.globalAlpha = ghost.state === "respawning" ? 0.35 : 1;
  ctx.fillStyle = color;

  ctx.beginPath();
  ctx.arc(x, y - r * 0.1, r, Math.PI, 0);
  ctx.lineTo(x + r, y + r * 0.6);
  const teeth = 4;
  for (let i = teeth; i >= 0; i--) {
    const tx = x - r + (2 * r * i) / teeth;
    const ty = y + (i % 2 === 0 ? r * 0.6 : r * 0.9);
    ctx.lineTo(tx, ty);
  }
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x - r * 0.35, y - r * 0.2, r * 0.22, 0, Math.PI * 2);
  ctx.arc(x + r * 0.35, y - r * 0.2, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a1a2e";
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.2, r * 0.1, 0, Math.PI * 2);
  ctx.arc(x + r * 0.4, y - r * 0.2, r * 0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;
}

export function renderFrame(ctx: CanvasRenderingContext2D, view: RenderView): void {
  drawMaze(ctx, view.grid);
  drawDots(ctx, view.dots);
  drawPellets(ctx, view.pellets);
  drawPlayer(ctx, view.player.pos, view.player.dir);

  const flashWhite = view.frightenedFlashing && !view.reduceMotion && Date.now() % 300 < 150;
  for (const ghost of view.ghosts) drawGhost(ctx, ghost, flashWhite);
}
