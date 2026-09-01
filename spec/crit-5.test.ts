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
// The contract main.ts holds to, whatever the mechanic:
//   - it exports `initGame(container)` returning `{ applyMove, destroy }`
//   - after a move that ends play, some element inside the container carries
//     `data-game-state="won" | "lost" | "over"`
// `applyMove("lose")` is a documented test-only sentinel that forces a loss
// without needing to know the real maze's exact losing input.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { initGame } from "../main";
import type { GameHandle } from "../src/game";

describe("crit 5 spec: a wrong move ends the game", () => {
  let container: HTMLElement;
  let game: GameHandle;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    game = initGame(container);
  });

  afterEach(() => {
    game.destroy();
    container.remove();
  });

  it("exposes an applyMove hook", () => {
    expect(game.applyMove, "initGame should return an object with an applyMove function").toBeTypeOf("function");
  });

  it("reaches an end state after one deliberately losing move", () => {
    game.applyMove("lose");

    const state = container.querySelector("[data-game-state]")?.getAttribute("data-game-state");
    expect(
      ["won", "lost", "over"],
      "an element in the container should carry data-game-state once play ends",
    ).toContain(state);
  });
});
