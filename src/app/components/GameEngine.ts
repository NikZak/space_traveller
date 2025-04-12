import { Spaceship } from "./Spaceship";
import type { Laser } from "./Laser";
import { Planet } from "./Planet";
import { Enemy } from "./Enemy";
import type { Rocket } from "./Rocket";
import { settings } from "./settings";

export interface GameState {
  spaceship: Spaceship;
  keys: { [key: string]: boolean };
  lasers: Laser[];
  planets: Planet[];
  enemies: Enemy[];
  rockets: Rocket[];
  frameCount: number;
  gameOver: boolean;
  score: number;
  enemySpawnTimer: number;
  enemySpawnInterval: number;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameState: GameState;
  private animationFrameId: number | null = null;
  private devicePixelRatio: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not get 2D context from canvas");
    }
    this.ctx = context;

    // Get device pixel ratio for high DPI displays
    this.devicePixelRatio = settings.display.device_pixel_ratio;

    // Initialize game state
    this.gameState = {
      spaceship: new Spaceship(
        canvas.width / 2,
        canvas.height / 2,
        this.devicePixelRatio
      ),
      keys: {
        [settings.controls.up_key]: false,
        [settings.controls.down_key]: false,
        [settings.controls.left_key]: false,
        [settings.controls.right_key]: false,
        [settings.controls.shoot_key]: false,
      },
      lasers: [],
      planets: this.generatePlanets(),
      enemies: [],
      rockets: [],
      frameCount: 0,
      gameOver: false,
      score: settings.game.initial_score,
      enemySpawnTimer: settings.game.enemy_spawn_timer,
      enemySpawnInterval: settings.game.enemy_spawn_interval,
    };

    // Set up resize handler
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener("resize", this.handleResize);

    // Set up input handlers
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);

    // Initial resize
    this.handleResize();
  }

  private generatePlanets(): Planet[] {
    const planets: Planet[] = [];
    const numPlanets = settings.planets.count;
    const minRadius = settings.planets.min_radius;
    const maxRadius = settings.planets.max_radius;
    const colors = settings.planets.colors;

    // Get visible dimensions
    const visibleWidth = this.canvas.width / this.devicePixelRatio;
    const visibleHeight = this.canvas.height / this.devicePixelRatio;

    for (let i = 0; i < numPlanets; i++) {
      const radius = minRadius + Math.random() * (maxRadius - minRadius);
      const x = radius + Math.random() * (visibleWidth - 2 * radius);
      const y = radius + Math.random() * (visibleHeight - 2 * radius);
      const color = colors[Math.floor(Math.random() * colors.length)];
      planets.push(new Planet(x, y, radius, color));
    }

    return planets;
  }

  private spawnEnemy(): void {
    // Determine spawn position (outside the screen)
    let x = 0;
    let y = 0;
    const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left

    // Get visible dimensions
    const visibleWidth = this.canvas.width / this.devicePixelRatio;
    const visibleHeight = this.canvas.height / this.devicePixelRatio;

    switch (side) {
      case 0: // Top
        x = Math.random() * visibleWidth;
        y = -settings.enemies.spawn_offset;
        break;
      case 1: // Right
        x = visibleWidth + settings.enemies.spawn_offset;
        y = Math.random() * visibleHeight;
        break;
      case 2: // Bottom
        x = Math.random() * visibleWidth;
        y = visibleHeight + settings.enemies.spawn_offset;
        break;
      case 3: // Left
        x = -settings.enemies.spawn_offset;
        y = Math.random() * visibleHeight;
        break;
    }

    // Determine enemy type with weighted probabilities
    const typeRoll = Math.random();
    let enemyType: "scout" | "fighter" | "destroyer";

    if (typeRoll < settings.enemies.scout_probability) {
      enemyType = "scout";
    } else if (
      typeRoll <
      settings.enemies.scout_probability + settings.enemies.fighter_probability
    ) {
      enemyType = "fighter";
    } else {
      enemyType = "destroyer";
    }

    // Create and add the enemy
    const enemy = new Enemy(x, y, enemyType, this.devicePixelRatio);
    this.gameState.enemies.push(enemy);
  }

  private handleResize(): void {
    // Get the parent container's dimensions
    const container = this.canvas.parentElement;
    if (!container) return;

    // Set canvas size to match container size
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Set canvas size in physical pixels
    this.canvas.width = width * this.devicePixelRatio;
    this.canvas.height = height * this.devicePixelRatio;

    // Set display size (CSS pixels)
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    // Scale context to account for device pixel ratio
    this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio);

    // Update spaceship position if it's off screen
    const { spaceship } = this.gameState;
    if (spaceship.x > width || spaceship.y > height) {
      spaceship.x = width / 2;
      spaceship.y = height / 2;
    }

    // Regenerate planets on resize
    this.gameState.planets = this.generatePlanets();
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (Object.prototype.hasOwnProperty.call(this.gameState.keys, e.key)) {
      this.gameState.keys[e.key] = true;
    }

    // Add restart functionality with configured key
    if (e.key.toLowerCase() === settings.controls.restart_key) {
      this.restartGame();
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    if (Object.prototype.hasOwnProperty.call(this.gameState.keys, e.key)) {
      this.gameState.keys[e.key] = false;
    }
  }

  private checkCollisions(): void {
    const { spaceship, planets, enemies, rockets, lasers } = this.gameState;

    // Check spaceship collision with planets
    for (const planet of planets) {
      if (planet.checkCollision(spaceship.x, spaceship.y, spaceship.size)) {
        this.gameState.gameOver = true;
        return;
      }
    }

    // Check spaceship collision with enemies
    for (const enemy of enemies) {
      if (
        enemy.active &&
        enemy.checkCollision(spaceship.x, spaceship.y, spaceship.size)
      ) {
        this.gameState.gameOver = true;
        return;
      }
    }

    // Check spaceship collision with rockets
    for (const rocket of rockets) {
      if (
        rocket.active &&
        rocket.checkCollision(spaceship.x, spaceship.y, spaceship.size)
      ) {
        this.gameState.gameOver = true;
        return;
      }
    }

    // Check enemy collisions with planets
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      if (!enemy.active) continue;

      for (const planet of planets) {
        if (planet.checkCollision(enemy.x, enemy.y, enemy.size)) {
          // Enemy dies when hitting a planet
          enemy.active = false;
          break;
        }
      }
    }

    // Check rocket collisions with planets
    for (let i = rockets.length - 1; i >= 0; i--) {
      const rocket = rockets[i];
      if (!rocket.active) continue;

      for (const planet of planets) {
        if (planet.checkCollision(rocket.x, rocket.y, rocket.size)) {
          // Rocket disappears when hitting a planet
          rocket.active = false;
          break;
        }
      }
    }

    // Check laser collisions with enemies
    for (let i = lasers.length - 1; i >= 0; i--) {
      const laser = lasers[i];
      let laserHit = false;

      // Check collision with enemies
      for (let j = enemies.length - 1; j >= 0; j--) {
        const enemy = enemies[j];
        if (
          enemy.active &&
          enemy.checkCollision(laser.x, laser.y, laser.size)
        ) {
          // Enemy takes damage
          const destroyed = enemy.takeDamage(10);
          if (destroyed) {
            // Add score based on enemy type
            switch (enemy.type) {
              case "scout":
                this.gameState.score += settings.enemies.scout_score;
                break;
              case "fighter":
                this.gameState.score += settings.enemies.fighter_score;
                break;
              case "destroyer":
                this.gameState.score += settings.enemies.destroyer_score;
                break;
            }
          }
          laserHit = true;
          break;
        }
      }

      // Check collision with rockets
      if (!laserHit) {
        for (let j = rockets.length - 1; j >= 0; j--) {
          const rocket = rockets[j];
          if (
            rocket.active &&
            rocket.checkCollision(laser.x, laser.y, laser.size)
          ) {
            rocket.active = false;
            this.gameState.score += settings.rockets.rocket_score;
            laserHit = true;
            break;
          }
        }
      }

      // Remove laser if it hit something
      if (laserHit) {
        lasers.splice(i, 1);
      }
    }
  }

  private update(): void {
    if (this.gameState.gameOver) return;

    const { spaceship, keys, frameCount, enemies, rockets } = this.gameState;
    this.gameState.frameCount++;

    // Handle input
    if (keys[settings.controls.up_key]) spaceship.accelerate();
    if (keys[settings.controls.down_key]) spaceship.decelerate();
    if (keys[settings.controls.left_key]) spaceship.rotateLeft();
    if (keys[settings.controls.right_key]) spaceship.rotateRight();

    // Handle shooting
    if (keys[settings.controls.shoot_key]) {
      const newLaser = spaceship.shoot(frameCount);
      if (newLaser) {
        this.gameState.lasers.push(newLaser);
      }
    }

    // Update spaceship
    spaceship.update(this.canvas);

    // Update lasers
    this.gameState.lasers = this.gameState.lasers.filter((laser) => {
      return laser.update(this.canvas);
    });

    // Update enemies
    for (const enemy of enemies) {
      if (enemy.active) {
        enemy.update(this.canvas, spaceship.x, spaceship.y);

        // Enemy shoots at player
        const rocket = enemy.shoot(frameCount, spaceship.x, spaceship.y);
        if (rocket) {
          this.gameState.rockets.push(rocket);
        }
      }
    }

    // Update rockets
    this.gameState.rockets = this.gameState.rockets.filter((rocket) => {
      // Check if rocket has exceeded 5 second lifetime
      if (Date.now() - rocket.timestamp > 5000) {
        return false;
      }
      return rocket.update(this.canvas);
    });

    // Spawn enemies
    this.gameState.enemySpawnTimer++;
    if (this.gameState.enemySpawnTimer >= this.gameState.enemySpawnInterval) {
      this.spawnEnemy();
      this.gameState.enemySpawnTimer = 0;

      // Gradually decrease spawn interval (make game harder)
      if (
        this.gameState.enemySpawnInterval >
        settings.game.min_enemy_spawn_interval
      ) {
        this.gameState.enemySpawnInterval -= 1;
      }
    }

    // Check for collisions
    this.checkCollisions();
  }

  private render(): void {
    // Clear canvas
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(
      0,
      0,
      this.canvas.width / this.devicePixelRatio,
      this.canvas.height / this.devicePixelRatio
    );

    // Draw planets
    for (const planet of this.gameState.planets) {
      planet.draw(this.ctx);
    }

    // Draw enemies
    for (const enemy of this.gameState.enemies) {
      enemy.draw(this.ctx);
    }

    // Draw rockets
    for (const rocket of this.gameState.rockets) {
      rocket.draw(this.ctx);
    }

    // Draw spaceship
    this.gameState.spaceship.draw(this.ctx);

    // Draw lasers
    for (const laser of this.gameState.lasers) {
      laser.draw(this.ctx);
    }

    // Draw score
    this.ctx.font = "24px Arial";
    this.ctx.fillStyle = "white";
    this.ctx.textAlign = "right";
    this.ctx.fillText(
      `Score: ${this.gameState.score}`,
      this.canvas.width / this.devicePixelRatio - 20,
      30
    );

    // Draw game over message
    if (this.gameState.gameOver) {
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      this.ctx.fillRect(
        0,
        0,
        this.canvas.width / this.devicePixelRatio,
        this.canvas.height / this.devicePixelRatio
      );

      this.ctx.font = "48px Arial";
      this.ctx.fillStyle = "white";
      this.ctx.textAlign = "center";
      this.ctx.fillText(
        "Game Over!",
        this.canvas.width / this.devicePixelRatio / 2,
        this.canvas.height / this.devicePixelRatio / 2
      );

      this.ctx.font = "24px Arial";
      this.ctx.fillText(
        `Final Score: ${this.gameState.score}`,
        this.canvas.width / this.devicePixelRatio / 2,
        this.canvas.height / this.devicePixelRatio / 2 + 40
      );

      this.ctx.fillText(
        "Press R to restart",
        this.canvas.width / this.devicePixelRatio / 2,
        this.canvas.height / this.devicePixelRatio / 2 + 80
      );
    }
  }

  private gameLoop(): void {
    this.update();
    this.render();
    this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
  }

  public start(): void {
    if (!this.animationFrameId) {
      this.gameLoop();
    }
  }

  public stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public cleanup(): void {
    this.stop();
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
  }

  public restartGame(): void {
    // Reset game state
    this.gameState = {
      spaceship: new Spaceship(
        this.canvas.width / this.devicePixelRatio / 2,
        this.canvas.height / this.devicePixelRatio / 2,
        this.devicePixelRatio
      ),
      keys: {
        [settings.controls.up_key]: false,
        [settings.controls.down_key]: false,
        [settings.controls.left_key]: false,
        [settings.controls.right_key]: false,
        [settings.controls.shoot_key]: false,
      },
      lasers: [],
      planets: this.generatePlanets(),
      enemies: [],
      rockets: [],
      frameCount: 0,
      gameOver: false,
      score: settings.game.initial_score,
      enemySpawnTimer: settings.game.enemy_spawn_timer,
      enemySpawnInterval: settings.game.enemy_spawn_interval,
    };
  }
}
