import { Spaceship } from "./Spaceship";
import type { Laser } from "./Laser";
import { Planet } from "./Planet";
import { Enemy } from "./Enemy";
import type { Rocket } from "./Rocket";

// Game settings
const settings = {
  game: {
    initial_score: 0,
    enemy_spawn_interval: 300,
    min_enemy_spawn_interval: 120,
    enemy_spawn_timer: 0,
  },
  display: {
    device_pixel_ratio: 1.0,
  },
  planets: {
    count: 5,
    min_radius: 15,
    max_radius: 40,
    colors: ["#4B0082", "#800080", "#9932CC", "#8A2BE2", "#9370DB"],
  },
  enemies: {
    scout_probability: 0.7,
    fighter_probability: 0.25,
    destroyer_probability: 0.05,
    scout_score: 100,
    fighter_score: 250,
    destroyer_score: 500,
    spawn_offset: 50,
  },
  rockets: {
    lifetime_ms: 5000,
    rocket_score: 10,
  },
  controls: {
    up_key: "ArrowUp",
    down_key: "ArrowDown",
    left_key: "ArrowLeft",
    right_key: "ArrowRight",
    shoot_key: " ",
    restart_key: "r",
  },
};

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
      spaceship: new Spaceship(canvas.width / 2, canvas.height / 2),
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
    const enemy = new Enemy(x, y, enemyType);
    this.gameState.enemies.push(enemy);
  }

  private handleResize(): void {
    // Set canvas size to match window size
    this.canvas.width = window.innerWidth * this.devicePixelRatio;
    this.canvas.height = window.innerHeight * this.devicePixelRatio;

    // Set display size (CSS pixels)
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;

    // Scale context to account for device pixel ratio
    this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio);

    // Update spaceship position if it's off screen
    const { spaceship } = this.gameState;
    const visibleWidth = this.canvas.width / this.devicePixelRatio;
    const visibleHeight = this.canvas.height / this.devicePixelRatio;

    if (spaceship.x > visibleWidth || spaceship.y > visibleHeight) {
      spaceship.x = visibleWidth / 2;
      spaceship.y = visibleHeight / 2;
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
    this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

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
      window.innerWidth - 20,
      30
    );

    // Draw game over message
    if (this.gameState.gameOver) {
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      this.ctx.font = "48px Arial";
      this.ctx.fillStyle = "white";
      this.ctx.textAlign = "center";
      this.ctx.fillText(
        "Game Over!",
        window.innerWidth / 2,
        window.innerHeight / 2
      );

      this.ctx.font = "24px Arial";
      this.ctx.fillText(
        `Final Score: ${this.gameState.score}`,
        window.innerWidth / 2,
        window.innerHeight / 2 + 40
      );

      this.ctx.fillText(
        "Press R to restart",
        window.innerWidth / 2,
        window.innerHeight / 2 + 80
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
      spaceship: new Spaceship(window.innerWidth / 2, window.innerHeight / 2),
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
