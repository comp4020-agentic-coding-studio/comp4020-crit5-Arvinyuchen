import { nextStepToward, stepAwayFrom } from "./bfs";
import type { Grid, Point } from "./maze";

export type GhostState = "normal" | "frightened" | "respawning" | "waiting";

const RESPAWN_TICKS = 6;

export class Ghost {
  readonly id: number;
  readonly color: string;
  readonly home: Point;
  pos: Point;
  state: GhostState;
  private respawnTicks = 0;
  private waitTicks: number;
  private readonly moveEvery: number;
  private moveCounter = 0;

  constructor(id: number, color: string, home: Point, releaseDelayTicks = 0, moveEvery = 1) {
    this.id = id;
    this.color = color;
    this.home = { ...home };
    this.pos = { ...home };
    this.waitTicks = releaseDelayTicks;
    this.state = releaseDelayTicks > 0 ? "waiting" : "normal";
    this.moveEvery = moveEvery;
  }

  /** Called when a power pellet is eaten. A respawning ghost stays put in
   *  the house rather than being yanked back into play mid-respawn. */
  frighten(): void {
    if (this.state === "normal") this.state = "frightened";
  }

  /** Called when the power-pellet timer runs out. */
  unfrighten(): void {
    if (this.state === "frightened") this.state = "normal";
  }

  /** Called when the player touches this ghost while it's frightened. */
  eaten(): void {
    this.state = "respawning";
    this.pos = { ...this.home };
    this.respawnTicks = RESPAWN_TICKS;
  }

  step(grid: Grid, playerPos: Point): void {
    if (this.state === "waiting") {
      this.waitTicks -= 1;
      if (this.waitTicks <= 0) this.state = "normal";
      return;
    }
    if (this.state === "respawning") {
      this.respawnTicks -= 1;
      if (this.respawnTicks <= 0) this.state = "normal";
      return;
    }

    this.moveCounter += 1;
    if (this.moveCounter % this.moveEvery !== 0) return;

    const next =
      this.state === "frightened"
        ? stepAwayFrom(grid, this.pos, playerPos)
        : nextStepToward(grid, this.pos, playerPos);
    if (next) this.pos = next;
  }
}
