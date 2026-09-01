import { Ghost } from "./ghost";
import { generateMaze } from "./maze";
import type { Point } from "./maze";
import { CELL_SIZE, renderFrame } from "./render";
import type { Direction } from "./render";

export type Move = Direction;
export type GameState = "playing" | "won" | "lost";

export interface GameHandle {
  applyMove(move: Move | "lose"): void;
  destroy(): void;
}

const STEP_MS = 150;
const FRIGHT_TICKS = 40; // ~6s at 150ms/tick
const FRIGHT_FLASH_TICKS = 12; // flash during the closing ~1.8s
const GHOST_COLORS = ["#ff3b3b", "#ff9edb", "#3ff0ff", "#ffb347"];
// Ghosts still take the true shortest path (see src/bfs.ts), but move at
// half the player's speed and leave home staggered, one at a time, so a
// first-time player gets a real chance to react instead of an instant swarm.
const GHOST_MOVE_EVERY = 2;
const GHOST_RELEASE_STAGGER_TICKS = 20; // ~3s at 150ms/tick

const DELTA: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function pointKey(p: Point): string {
  return `${p.x},${p.y}`;
}

function samePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

export function initGame(container: HTMLElement): GameHandle {
  const maze = generateMaze();
  const dots = new Set(maze.dots.map(pointKey));
  const pellets = new Set(maze.pellets.map(pointKey));
  const totalDots = dots.size;

  const ghosts = maze.ghostHome.map(
    (home, i) =>
      new Ghost(i, GHOST_COLORS[i % GHOST_COLORS.length], home, i * GHOST_RELEASE_STAGGER_TICKS, GHOST_MOVE_EVERY),
  );

  let playerPos: Point = { ...maze.playerSpawn };
  let facing: Direction = "left";
  let queuedDirection: Direction = "left";
  let gameState: GameState = "playing";
  let frightTicksLeft = 0;

  container.innerHTML = "";
  container.classList.add("game");

  const canvas = document.createElement("canvas");
  canvas.width = maze.width * CELL_SIZE;
  canvas.height = maze.height * CELL_SIZE;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "Maze game");
  container.appendChild(canvas);

  const status = document.createElement("div");
  status.className = "game-status";
  status.setAttribute("aria-live", "polite");
  status.dataset.gameState = gameState;
  container.appendChild(status);

  // Visual-only counter; the aria-live status above carries the one message
  // that actually matters to a screen reader (the ending), so this stays out
  // of the accessibility tree rather than chattering every tick.
  const hud = document.createElement("div");
  hud.className = "game-hud";
  hud.setAttribute("aria-hidden", "true");
  container.appendChild(hud);

  function updateHud(): void {
    hud.textContent = `${totalDots - dots.size} / ${totalDots} dots`;
  }
  updateHud();

  const ctx = canvas.getContext("2d");

  const reduceMotion =
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  function setGameState(next: GameState): void {
    if (gameState === next) return;
    gameState = next;
    status.dataset.gameState = gameState;
    status.classList.toggle("game-status--ended", gameState !== "playing");
    status.textContent =
      gameState === "won"
        ? "All dots cleared — you win."
        : gameState === "lost"
          ? "A ghost caught you — game over."
          : "";
  }

  function render(): void {
    if (!ctx) return;
    renderFrame(ctx, {
      grid: maze.grid,
      dots: [...dots].map((k) => {
        const [x, y] = k.split(",").map(Number);
        return { x, y };
      }),
      pellets: [...pellets].map((k) => {
        const [x, y] = k.split(",").map(Number);
        return { x, y };
      }),
      player: { pos: playerPos, dir: facing },
      ghosts: ghosts.map((g) => ({ pos: g.pos, color: g.color, state: g.state })),
      frightenedFlashing: frightTicksLeft > 0 && frightTicksLeft <= FRIGHT_FLASH_TICKS,
      reduceMotion,
    });
  }

  function tryMove(pos: Point, dir: Direction): Point | null {
    const next = { x: pos.x + DELTA[dir].x, y: pos.y + DELTA[dir].y };
    if (next.y < 0 || next.y >= maze.grid.length || next.x < 0 || next.x >= maze.grid[0].length) return null;
    return maze.grid[next.y][next.x] === 1 ? next : null;
  }

  function tick(): void {
    if (gameState !== "playing") return;

    const prevPlayerPos = playerPos;
    const queuedMove = tryMove(playerPos, queuedDirection);
    if (queuedMove) {
      facing = queuedDirection;
      playerPos = queuedMove;
    } else {
      const forwardMove = tryMove(playerPos, facing);
      if (forwardMove) playerPos = forwardMove;
    }

    const key = pointKey(playerPos);
    if (dots.delete(key)) {
      updateHud();
      if (dots.size === 0) {
        setGameState("won");
        return;
      }
    }
    if (pellets.delete(key)) {
      for (const ghost of ghosts) ghost.frighten();
      frightTicksLeft = FRIGHT_TICKS;
    }

    if (frightTicksLeft > 0) {
      frightTicksLeft -= 1;
      if (frightTicksLeft === 0) for (const ghost of ghosts) ghost.unfrighten();
    }

    for (const ghost of ghosts) {
      const prevGhostPos = ghost.pos;
      ghost.step(maze.grid, playerPos);

      const collided =
        samePoint(ghost.pos, playerPos) || (samePoint(prevGhostPos, playerPos) && samePoint(prevPlayerPos, ghost.pos));
      if (!collided) continue;

      if (ghost.state === "frightened") {
        ghost.eaten();
      } else if (ghost.state === "normal") {
        setGameState("lost");
        return;
      }
    }
  }

  let rafId = 0;
  let last = performance.now();
  let acc = 0;

  function frame(now: number): void {
    acc += now - last;
    last = now;
    while (acc >= STEP_MS) {
      tick();
      acc -= STEP_MS;
    }
    render();
    rafId = requestAnimationFrame(frame);
  }

  render();
  rafId = requestAnimationFrame(frame);

  return {
    applyMove(move) {
      if (move === "lose") {
        setGameState("lost");
        return;
      }
      queuedDirection = move;
    },
    destroy() {
      cancelAnimationFrame(rafId);
    },
  };
}
