// @vitest-environment jsdom
//
// Contract tests for this week's published spec (crit-5, "A game"):
// https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/crits/05-game/
//
// Most of the spec is judged by a person at the crit (no-tutorial affordance,
// five-minute stranger test, depth). This file covers the one line the spec
// itself asks for a focused automated test on: "it can be lost: a wrong move
// is possible, and play ends somewhere — a win, a loss or a finish."
//
// This starts red on purpose — there's no game yet. The contract it holds
// main.ts to, whatever the mechanic ends up being:
//   - it sets `window.game` to an object with `applyMove(move: unknown): void`
//   - after a move that ends play, some element in the document carries
//     `data-game-state="won" | "lost" | "over"`
// Update the "one deliberately losing move" below once the mechanic exists;
// the shape of the contract shouldn't need to change with it.
import { beforeEach, describe, expect, it } from "vitest";

declare global {
  interface Window {
    game?: { applyMove: (move: unknown) => void };
  }
}

describe("crit 5 spec: a wrong move ends the game", () => {
  beforeEach(async () => {
    document.body.innerHTML = "";
    delete window.game;
    await import("../main");
  });

  it("exposes a window.game.applyMove hook", () => {
    expect(
      window.game,
      "main.ts should set window.game = { applyMove } so a move can be driven without knowing the UI's input method",
    ).toBeTruthy();
  });

  it("reaches an end state after one deliberately losing move", () => {
    // The one clearly-losing input sequence for this game's rule. Replace
    // `"lose"` with whatever move actually loses once the mechanic exists.
    window.game?.applyMove("lose");

    const state = document.querySelector("[data-game-state]")?.getAttribute("data-game-state");
    expect(
      ["won", "lost", "over"],
      "an element in the document should carry data-game-state once play ends",
    ).toContain(state);
  });
});
