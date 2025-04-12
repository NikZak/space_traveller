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
  }

  update(): Enemy | null {
    const currentTime = Date.now();

    // Handle round transition
    if (this.isRoundTransition) {
      const timeInTransition = currentTime - this.roundStartTime;

      if (timeInTransition >= settings.rounds.round_duration) {
        this.isRoundTransition = false;
        // Set lastSpawnTime to now to start spawning immediately
        this.lastSpawnTime = currentTime;
      }
      return null;
    }

    // Spawn enemies
    const timeSinceLastSpawn = currentTime - this.lastSpawnTime;

    if (timeSinceLastSpawn >= settings.rounds.spawn_delay) {
      this.lastSpawnTime = currentTime;
      const enemy = this.spawnNextEnemy();
      if (enemy) {
        return enemy;
      }
    }

    return null;
  }

  private spawnNextEnemy(): Enemy | null {
    // Check if we need to spawn more enemies
    const scoutCount = this.getEnemiesForRound("scout");
    const fighterCount = this.getEnemiesForRound("fighter");
    const destroyerCount = this.getEnemiesForRound("destroyer");

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

    return new Enemy(x, y, type, settings.display.device_pixel_ratio);
  }

  enemyDestroyed(): void {
    this.enemiesRemaining--;
  }

  isRoundComplete(): boolean {
    return !this.isRoundTransition && this.enemiesRemaining === 0;
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
    return (
      this.getEnemiesForRound("scout") +
      this.getEnemiesForRound("fighter") +
      this.getEnemiesForRound("destroyer")
    );
  }

  private getEnemiesForRound(type: "scout" | "fighter" | "destroyer"): number {
    const roundIndex = Math.min(
      this.currentRound - 1,
      settings.rounds.enemies_per_round[type].length - 1
    );
    return settings.rounds.enemies_per_round[type][roundIndex];
  }
}
