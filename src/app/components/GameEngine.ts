import { Spaceship } from "./Spaceship";
import type { Laser } from "./Laser";
import { Planet } from "./Planet";
import { Enemy } from "./Enemy";
import type { Rocket } from "./Rocket";
import { settings } from "./settings";
import { RoundManager } from "./RoundManager";

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
  lives: number;
  roundManager: RoundManager;
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
      lives: settings.game.initial_lives,
      roundManager: new RoundManager(canvas),
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
    // Prevent default space bar scrolling
    if (e.code === "Space") {
      e.preventDefault();
    }

    // Convert key to the format we're using in settings
    const key = e.code === "Space" ? " " : e.key;

    console.log("Key down:", key, "Code:", e.code);

    // If game is over, only allow restart
    if (this.gameState.gameOver) {
      if (e.key.toLowerCase() === settings.controls.restart_key) {
        this.restartGame();
      }
      return;
    }

    if (Object.prototype.hasOwnProperty.call(this.gameState.keys, key)) {
      this.gameState.keys[key] = true;
      console.log("Game state keys:", this.gameState.keys);
    }

    // Add restart functionality with configured key
    if (e.key.toLowerCase() === settings.controls.restart_key) {
      this.restartGame();
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    // Convert key to the format we're using in settings
    const key = e.code === "Space" ? " " : e.key;

    console.log("Key up:", key, "Code:", e.code);

    if (Object.prototype.hasOwnProperty.call(this.gameState.keys, key)) {
      this.gameState.keys[key] = false;
      console.log("Game state keys:", this.gameState.keys);
    }
  }

  private checkCollisions(): void {
    const { spaceship, planets, enemies, rockets, lasers, roundManager } =
      this.gameState;

    // Check spaceship collision with planets
    for (const planet of planets) {
      if (planet.checkCollision(spaceship.x, spaceship.y, spaceship.size)) {
        this.handleSpaceshipDeath();
        return;
      }
    }

    // Check spaceship collision with enemies
    for (const enemy of enemies) {
      if (
        enemy.active &&
        enemy.checkCollision(spaceship.x, spaceship.y, spaceship.size)
      ) {
        this.handleSpaceshipDeath();
        return;
      }
    }

    // Check spaceship collision with rockets
    for (const rocket of rockets) {
      if (
        rocket.active &&
        rocket.checkCollision(spaceship.x, spaceship.y, spaceship.size)
      ) {
        this.handleSpaceshipDeath();
        return;
      }
    }

    // Check enemy collisions with planets
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      if (!enemy.active) continue;

      for (const planet of planets) {
        if (planet.checkCollision(enemy.x, enemy.y, enemy.size)) {
          // Enemy dies when hitting a planet and awards points
          enemy.active = false;
          roundManager.enemyDestroyed();
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
      }
    }

    // Check laser collisions with enemies
    for (let i = lasers.length - 1; i >= 0; i--) {
      const laser = lasers[i];
      let laserHit = false;

      for (let j = enemies.length - 1; j >= 0; j--) {
        const enemy = enemies[j];
        if (!enemy.active) continue;

        if (enemy.checkCollision(laser.x, laser.y, laser.size)) {
          // Enemy takes damage
          if (enemy.takeDamage(10)) {
            // Enemy destroyed
            roundManager.enemyDestroyed();
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

      if (laserHit) {
        lasers.splice(i, 1);
      }
    }

    // Check laser collisions with rockets
    for (let i = lasers.length - 1; i >= 0; i--) {
      const laser = lasers[i];
      let laserHit = false;

      for (let j = rockets.length - 1; j >= 0; j--) {
        const rocket = rockets[j];
        if (!rocket.active) continue;

        if (rocket.checkCollision(laser.x, laser.y, laser.size)) {
          rocket.active = false;
          this.gameState.score += settings.rockets.rocket_score;
          laserHit = true;
          break;
        }
      }

      if (laserHit) {
        lasers.splice(i, 1);
      }
    }
  }

  private handleSpaceshipDeath(): void {
    if (this.gameState.lives > 0) {
      this.gameState.lives--;
      if (this.gameState.lives <= 0) {
        this.gameState.gameOver = true;
        this.stop(); // Stop the game loop when game is over
      } else {
        // Reset spaceship position
        this.gameState.spaceship = new Spaceship(
          this.canvas.width / this.devicePixelRatio / 2,
          this.canvas.height / this.devicePixelRatio / 2,
          this.devicePixelRatio
        );
      }
    }
  }

  private update(): void {
    // Don't update anything if game is over
    if (this.gameState.gameOver) {
      return;
    }

    const { spaceship, lasers, rockets, enemies, roundManager } =
      this.gameState;
    const canvas = this.canvas;

    // Update spaceship
    spaceship.update(canvas);

    // Handle input
    if (this.gameState.keys.ArrowUp) {
      spaceship.accelerate();
    }
    if (this.gameState.keys.ArrowDown) {
      spaceship.decelerate();
    }
    if (this.gameState.keys.ArrowLeft) {
      spaceship.rotateLeft();
    }
    if (this.gameState.keys.ArrowRight) {
      spaceship.rotateRight();
    }
    if (this.gameState.keys[settings.controls.shoot_key]) {
      console.log("Attempting to shoot, frame:", this.gameState.frameCount);
      const laser = spaceship.shoot(this.gameState.frameCount);
      if (laser) {
        console.log("Laser created");
        lasers.push(laser);
      } else {
        console.log("No laser created - cooldown or no ammo");
      }
    }

    // Update lasers
    for (let i = lasers.length - 1; i >= 0; i--) {
      const laser = lasers[i];
      if (!laser.update(canvas)) {
        lasers.splice(i, 1);
      }
    }

    // Update rockets
    for (let i = rockets.length - 1; i >= 0; i--) {
      const rocket = rockets[i];
      if (!rocket.update(canvas)) {
        rockets.splice(i, 1);
      }
    }

    // Update enemies and handle enemy shooting
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      enemy.update(canvas, spaceship.x, spaceship.y);

      // Handle enemy shooting
      const rocket = enemy.shoot(
        this.gameState.frameCount,
        spaceship.x,
        spaceship.y
      );
      if (rocket) {
        console.log("Enemy created rocket");
        rockets.push(rocket);
      }

      // Only remove inactive enemies, but don't call enemyDestroyed here
      // since it's already called in collision checks
      if (!enemy.active) {
        enemies.splice(i, 1);
      }
    }

    // Handle round management
    const newEnemy = roundManager.update();
    if (newEnemy) {
      console.log("Adding new enemy to game state:", newEnemy);
      enemies.push(newEnemy);
      console.log("Total enemies in game state:", enemies.length);
    }

    // Only start next round if:
    // 1. Current round is complete (all enemies spawned and transition done)
    // 2. No active enemies remain
    // 3. No inactive enemies waiting to be cleaned up
    if (
      roundManager.isRoundComplete() &&
      enemies.length === 0 &&
      !roundManager.isInTransition()
    ) {
      console.log("Round complete, starting next round");
      // Regenerate planets for the new round
      this.gameState.planets = this.generatePlanets();
      roundManager.startRound();
    }

    // Check collisions
    this.checkCollisions();
  }

  private render(): void {
    const {
      spaceship,
      lasers,
      planets,
      enemies,
      rockets,
      roundManager,
      gameOver,
    } = this.gameState;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw planets
    for (const planet of planets) {
      planet.draw(this.ctx);
    }

    // Draw lasers
    for (const laser of lasers) {
      laser.draw(this.ctx);
    }

    // Draw rockets
    for (const rocket of rockets) {
      rocket.draw(this.ctx);
    }

    // Draw enemies
    console.log(`Rendering ${enemies.length} enemies`);
    for (const enemy of enemies) {
      if (enemy.active) {
        console.log(`Drawing enemy: ${enemy.type} at (${enemy.x}, ${enemy.y})`);
        enemy.draw(this.ctx);
      }
    }

    // Draw spaceship
    spaceship.draw(this.ctx);

    // Draw round transition text or game over message
    if (roundManager.isInTransition() || gameOver) {
      this.ctx.save();
      this.ctx.scale(1 / this.devicePixelRatio, 1 / this.devicePixelRatio);

      this.ctx.font = "48px Arial";
      this.ctx.fillStyle = "#FFFFFF";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";

      if (gameOver) {
        this.ctx.fillText(
          "GAME OVER",
          this.canvas.width / 2,
          this.canvas.height / 2
        );
        this.ctx.font = "24px Arial";
        this.ctx.fillText(
          "Press R to restart",
          this.canvas.width / 2,
          this.canvas.height / 2 + 40
        );
      } else if (roundManager.isGameComplete()) {
        this.ctx.fillText(
          "THE END",
          this.canvas.width / 2,
          this.canvas.height / 2
        );
      } else {
        this.ctx.fillText(
          `ROUND ${roundManager.getCurrentRound()}`,
          this.canvas.width / 2,
          this.canvas.height / 2
        );
        this.ctx.font = "24px Arial";
        this.ctx.fillText(
          "Good luck, soldier!",
          this.canvas.width / 2,
          this.canvas.height / 2 + 40
        );
      }

      this.ctx.restore();
    }

    // Draw score and lives
    this.ctx.save();
    this.ctx.scale(1 / this.devicePixelRatio, 1 / this.devicePixelRatio);

    this.ctx.font = "24px Arial";
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.textAlign = "left";
    this.ctx.textBaseline = "top";
    this.ctx.fillText(`Score: ${this.gameState.score}`, 10, 10);
    this.ctx.fillText(`Lives: ${this.gameState.lives}`, 10, 40);
    this.ctx.fillText(`Round: ${roundManager.getCurrentRound()}`, 10, 70);

    this.ctx.restore();
  }

  private gameLoop(): void {
    // Increment frame count
    this.gameState.frameCount++;
    console.log("Game loop running, frame:", this.gameState.frameCount);

    this.update();
    this.render();
    this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
  }

  public start(): void {
    console.log("Starting game...");
    if (!this.animationFrameId) {
      // Start the first round
      this.gameState.roundManager.startRound();
      console.log("Game loop starting...");
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
        this.canvas.width / 2,
        this.canvas.height / 2,
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
      lives: settings.game.initial_lives,
      roundManager: new RoundManager(this.canvas),
    };

    // Start the first round
    this.gameState.roundManager.startRound();
  }
}
