import { settings } from "./settings";
import { Enemy } from "./Enemy";

export class RoundManager {
  private currentRound: number;
  private enemiesRemaining: number;
  private roundStartTime: number;
  private isRoundTransition: boolean;
  private lastSpawnTime: number;
  private spawnedEnemies: { scout: number; fighter: number; destroyer: number };
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.currentRound = 0;
    this.enemiesRemaining = 0;
    this.roundStartTime = 0;
    this.isRoundTransition = false;
    this.lastSpawnTime = 0;
    this.spawnedEnemies = { scout: 0, fighter: 0, destroyer: 0 };
    this.canvas = canvas;
  }

  startRound(): void {
    this.currentRound++;
    this.enemiesRemaining = this.getTotalEnemiesForRound();
    this.roundStartTime = Date.now();
    this.isRoundTransition = true;
    this.spawnedEnemies = { scout: 0, fighter: 0, destroyer: 0 };
    console.log(
      `Starting round ${this.currentRound} with ${this.enemiesRemaining} enemies`
    );
  }

  update(): Enemy | null {
    const currentTime = Date.now();

    // Handle round transition
    if (this.isRoundTransition) {
      const timeInTransition = currentTime - this.roundStartTime;
      console.log(`Time in transition: ${timeInTransition}ms`);

      if (timeInTransition >= settings.rounds.round_duration) {
        this.isRoundTransition = false;
        console.log("Round transition complete, starting enemy spawns");
        // Set lastSpawnTime to now to start spawning immediately
        this.lastSpawnTime = currentTime;
      }
      return null;
    }

    // Spawn enemies
    const timeSinceLastSpawn = currentTime - this.lastSpawnTime;
    console.log(`Time since last spawn: ${timeSinceLastSpawn}ms`);

    if (timeSinceLastSpawn >= settings.rounds.spawn_delay) {
      this.lastSpawnTime = currentTime;
      const enemy = this.spawnNextEnemy();
      if (enemy) {
        console.log(`Spawning ${enemy.type} enemy at (${enemy.x}, ${enemy.y})`);
        return enemy;
      } else {
        console.log("No more enemies to spawn this round");
      }
    }

    return null;
  }

  private spawnNextEnemy(): Enemy | null {
    // Check if we need to spawn more enemies
    const scoutCount = this.getEnemiesForRound("scout");
    const fighterCount = this.getEnemiesForRound("fighter");
    const destroyerCount = this.getEnemiesForRound("destroyer");

    console.log(
      `Enemies to spawn: scout=${scoutCount}, fighter=${fighterCount}, destroyer=${destroyerCount}`
    );
    console.log(
      `Enemies spawned: scout=${this.spawnedEnemies.scout}, fighter=${this.spawnedEnemies.fighter}, destroyer=${this.spawnedEnemies.destroyer}`
    );

    if (
      this.spawnedEnemies.scout < scoutCount ||
      this.spawnedEnemies.fighter < fighterCount ||
      this.spawnedEnemies.destroyer < destroyerCount
    ) {
      // Determine which enemy type to spawn
      let enemyType: "scout" | "fighter" | "destroyer" = "scout";
      if (this.spawnedEnemies.fighter < fighterCount) {
        enemyType = "fighter";
      } else if (this.spawnedEnemies.destroyer < destroyerCount) {
        enemyType = "destroyer";
      }

      // Spawn the enemy
      this.spawnedEnemies[enemyType]++;
      const enemy = this.createEnemy(enemyType);
      console.log(`Created ${enemyType} enemy:`, enemy);
      return enemy;
    }

    return null;
  }

  private createEnemy(type: "scout" | "fighter" | "destroyer"): Enemy {
    // Random position around the edges of the canvas
    const side = Math.floor(Math.random() * 4);
    let x: number;
    let y: number;

    // Get visible dimensions
    const visibleWidth =
      this.canvas.width / settings.display.device_pixel_ratio;
    const visibleHeight =
      this.canvas.height / settings.display.device_pixel_ratio;

    switch (side) {
      case 0: // Top
        x = Math.random() * visibleWidth;
        y = -50;
        break;
      case 1: // Right
        x = visibleWidth + 50;
        y = Math.random() * visibleHeight;
        break;
      case 2: // Bottom
        x = Math.random() * visibleWidth;
        y = visibleHeight + 50;
        break;
      default: // Left
        x = -50;
        y = Math.random() * visibleHeight;
        break;
    }

    console.log(`Creating ${type} enemy at (${x}, ${y})`);
    const enemy = new Enemy(x, y, type, settings.display.device_pixel_ratio);
    console.log("Enemy created with properties:", {
      x: enemy.x,
      y: enemy.y,
      type: enemy.type,
      active: enemy.active,
      size: enemy.size,
    });
    return enemy;
  }

  enemyDestroyed(): void {
    this.enemiesRemaining--;
    console.log(`Enemy destroyed, ${this.enemiesRemaining} remaining`);
  }

  isRoundComplete(): boolean {
    const complete = !this.isRoundTransition && this.enemiesRemaining === 0;
    console.log(
      `Round complete check: transition=${this.isRoundTransition}, remaining=${this.enemiesRemaining}, complete=${complete}`
    );
    return complete;
  }

  isGameComplete(): boolean {
    return (
      this.currentRound >= settings.rounds.max_rounds && this.isRoundComplete()
    );
  }

  getCurrentRound(): number {
    return this.currentRound;
  }

  isInTransition(): boolean {
    return this.isRoundTransition;
  }

  private getTotalEnemiesForRound(): number {
    const total =
      this.getEnemiesForRound("scout") +
      this.getEnemiesForRound("fighter") +
      this.getEnemiesForRound("destroyer");
    console.log(`Total enemies for round ${this.currentRound}: ${total}`);
    return total;
  }

  private getEnemiesForRound(type: "scout" | "fighter" | "destroyer"): number {
    const roundIndex = Math.min(
      this.currentRound - 1,
      settings.rounds.enemies_per_round[type].length - 1
    );
    const count = settings.rounds.enemies_per_round[type][roundIndex];
    console.log(`Enemies for ${type} in round ${this.currentRound}: ${count}`);
    return count;
  }
}
