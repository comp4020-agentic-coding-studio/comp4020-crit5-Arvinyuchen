// The TypeScript entry point, loaded as a module by index.html. Vite compiles
// it; `pnpm typecheck` type-checks it.
import { initGame } from "./src/game";
import type { Move } from "./src/game";

export { initGame };
export type { Move };

declare global {
  interface Window {
    game?: { applyMove: (move: Move | "lose") => void };
  }
}

const KEY_TO_MOVE: Record<string, Move> = {
  w: "up",
  a: "left",
  s: "down",
  d: "right",
};

const app = document.getElementById("app");
if (app) {
  const game = initGame(app);
  window.game = game;

  document.addEventListener("keydown", (event) => {
    const move = KEY_TO_MOVE[event.key.toLowerCase()];
    if (move) {
      event.preventDefault();
      game.applyMove(move);
    }
  });
}
