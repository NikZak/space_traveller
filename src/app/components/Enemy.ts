import { Rocket } from "./Rocket";
import { settings } from "./settings";

type EnemyType = "scout" | "fighter" | "destroyer";

interface EnemyConfig {
  size: number;
  health: number;
  maxHealth: number;
  shootCooldown: number;
  color: string;
  eyeColor: string;
  maxAmmo: number;
  rotationSpeed: number;
  rotationInertia: number;
  acceleration: number;
  deceleration: number;
  maxSpeed: number;
  minSpeed: number;
  accelerationDistance: number;
  decelerationDistance: number;
}

export class Enemy {
  x: number;
  y: number;
  velocity: { x: number; y: number };
  rotation: number;
  size = 0;
  active: boolean;
  health = 0;
  maxHealth = 0;
  shootCooldown = 0;
  lastShotTime: number;
  type: EnemyType;
  color = "#000000";
  eyeColor = "#FFFFFF";
  glowIntensity: number;
  glowDirection: number;
  pulseSpeed: number;
  devicePixelRatio: number;
  targetRotation: number;
  rotationSpeed: number;
  currentSpeed: number;
  targetSpeed: number;
  ammo = 0;
  maxAmmo = 0;
  private config: EnemyConfig;

  constructor(
    x: number,
    y: number,
    type: EnemyType = "scout",
    devicePixelRatio = 1
  ) {
    this.x = x;
    this.y = y;
    this.active = true;
    this.type = type;
    this.pulseSpeed = 0.05 + Math.random() * 0.05;
    this.glowIntensity = 0.5;
    this.glowDirection = 1;
    this.devicePixelRatio = devicePixelRatio;
    this.targetRotation = 0;
    this.rotationSpeed = 0.1;
    this.currentSpeed = 0;
    this.targetSpeed = 0;
    this.velocity = { x: 0, y: 0 };
    this.rotation = 0;
    this.lastShotTime = 0;

    // Initialize enemy configuration
    this.config = this.getEnemyConfig(type);
    this.applyConfig();

    // Random initial velocity
    const speed = 1 + Math.random() * 2;
    const angle = Math.random() * Math.PI * 2;
    this.velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    };
  }

  private getEnemyConfig(type: EnemyType): EnemyConfig {
    switch (type) {
      case "scout":
        return {
          size: settings.game.enemy_sizes.scout,
          health: settings.enemies.scout.health,
          maxHealth: settings.enemies.scout.health,
          shootCooldown: settings.enemies.scout.shoot_cooldown,
          color: "#8B0000",
          eyeColor: "#FF0000",
          maxAmmo: settings.enemies.scout.max_ammo,
          rotationSpeed: settings.enemies.scout.rotation_speed,
          rotationInertia: settings.enemies.scout.rotation_inertia,
          acceleration: settings.enemies.scout.acceleration,
          deceleration: settings.enemies.scout.deceleration,
          maxSpeed: settings.enemies.scout.max_speed,
          minSpeed: settings.enemies.scout.min_speed,
          accelerationDistance: settings.enemies.scout.acceleration_distance,
          decelerationDistance: settings.enemies.scout.deceleration_distance,
        };
      case "fighter":
        return {
          size: settings.game.enemy_sizes.fighter,
          health: settings.enemies.fighter.health,
          maxHealth: settings.enemies.fighter.health,
          shootCooldown: settings.enemies.fighter.shoot_cooldown,
          color: "#800080",
          eyeColor: "#FF00FF",
          maxAmmo: settings.enemies.fighter.max_ammo,
          rotationSpeed: settings.enemies.fighter.rotation_speed,
          rotationInertia: settings.enemies.fighter.rotation_inertia,
          acceleration: settings.enemies.fighter.acceleration,
          deceleration: settings.enemies.fighter.deceleration,
          maxSpeed: settings.enemies.fighter.max_speed,
          minSpeed: settings.enemies.fighter.min_speed,
          accelerationDistance: settings.enemies.fighter.acceleration_distance,
          decelerationDistance: settings.enemies.fighter.deceleration_distance,
        };
      case "destroyer":
        return {
          size: settings.game.enemy_sizes.destroyer,
          health: settings.enemies.destroyer.health,
          maxHealth: settings.enemies.destroyer.health,
          shootCooldown: settings.enemies.destroyer.shoot_cooldown,
          color: "#000080",
          eyeColor: "#00FFFF",
          maxAmmo: settings.enemies.destroyer.max_ammo,
          rotationSpeed: settings.enemies.destroyer.rotation_speed,
          rotationInertia: settings.enemies.destroyer.rotation_inertia,
          acceleration: settings.enemies.destroyer.acceleration,
          deceleration: settings.enemies.destroyer.deceleration,
          maxSpeed: settings.enemies.destroyer.max_speed,
          minSpeed: settings.enemies.destroyer.min_speed,
          accelerationDistance:
            settings.enemies.destroyer.acceleration_distance,
          decelerationDistance:
            settings.enemies.destroyer.deceleration_distance,
        };
    }
  }

  private applyConfig(): void {
    this.size = this.config.size;
    this.health = this.config.health;
    this.maxHealth = this.config.maxHealth;
    this.shootCooldown = this.config.shootCooldown;
    this.color = this.config.color;
    this.eyeColor = this.config.eyeColor;
    this.maxAmmo = this.config.maxAmmo;
    this.ammo = this.maxAmmo;
  }

  update(canvas: HTMLCanvasElement, playerX: number, playerY: number): void {
    if (!this.active) return;

    // Calculate distance to player
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);
    this.targetRotation = Math.atan2(dy, dx);

    // Update rotation and speed
    this.updateRotation();
    this.updateSpeed(distanceToPlayer);

    // Apply velocity based on current rotation
    this.velocity.x = Math.cos(this.rotation) * this.currentSpeed;
    this.velocity.y = Math.sin(this.rotation) * this.currentSpeed;

    // Update position
    this.x += this.velocity.x;
    this.y += this.velocity.y;

    // Update glow effect
    this.updateGlow();

    // Wrap around screen
    this.wrapAroundScreen(canvas);
  }

  private updateRotation(): void {
    const angleDiff = this.targetRotation - this.rotation;
    const normalizedAngleDiff =
      ((angleDiff + Math.PI) % (Math.PI * 2)) - Math.PI;
    const targetRotationSpeed = normalizedAngleDiff * this.config.rotationSpeed;
    this.rotationSpeed =
      this.rotationSpeed * this.config.rotationInertia +
      targetRotationSpeed * (1 - this.config.rotationInertia);
    this.rotation += this.rotationSpeed;
  }

  private updateSpeed(distanceToPlayer: number): void {
    if (distanceToPlayer > this.config.accelerationDistance) {
      this.targetSpeed = this.config.maxSpeed;
    } else if (distanceToPlayer < this.config.decelerationDistance) {
      this.targetSpeed = this.config.minSpeed;
    }

    if (this.currentSpeed < this.targetSpeed) {
      this.currentSpeed = Math.min(
        this.currentSpeed + this.config.acceleration,
        this.targetSpeed
      );
    } else if (this.currentSpeed > this.targetSpeed) {
      this.currentSpeed = Math.max(
        this.currentSpeed - this.config.deceleration,
        this.targetSpeed
      );
    }
  }

  private updateGlow(): void {
    this.glowIntensity += this.glowDirection * this.pulseSpeed;
    if (this.glowIntensity > 0.8 || this.glowIntensity < 0.2) {
      this.glowDirection *= -1;
    }
  }

  private wrapAroundScreen(canvas: HTMLCanvasElement): void {
    const visibleWidth = canvas.width / this.devicePixelRatio;
    const visibleHeight = canvas.height / this.devicePixelRatio;

    if (this.x < -this.size) this.x = visibleWidth + this.size;
    if (this.x > visibleWidth + this.size) this.x = -this.size;
    if (this.y < -this.size) this.y = visibleHeight + this.size;
    if (this.y > visibleHeight + this.size) this.y = -this.size;
  }

  private drawHealthBar(ctx: CanvasRenderingContext2D): void {
    const barWidth = this.size * 2;
    const barHeight = this.size * 0.2;
    const healthPercentage = this.health / this.maxHealth;

    // Health bar background
    ctx.fillStyle = "#333";
    ctx.fillRect(-this.size, -this.size * 1.5, barWidth, barHeight);

    // Health bar
    ctx.fillStyle =
      healthPercentage > 0.5
        ? "#0f0"
        : healthPercentage > 0.25
        ? "#ff0"
        : "#f00";
    ctx.fillRect(
      -this.size,
      -this.size * 1.5,
      barWidth * healthPercentage,
      barHeight
    );
  }

  private drawAmmoBar(ctx: CanvasRenderingContext2D): void {
    const barWidth = this.size * 2;
    const barHeight = this.size * 0.1;
    const ammoPercentage = this.ammo / this.maxAmmo;
    const ammoBarY = -this.size * 1.5 - barHeight - 2;

    // Ammo bar background
    ctx.fillStyle = "#333";
    ctx.fillRect(-this.size, ammoBarY, barWidth, barHeight);

    // Ammo bar with improved visibility
    const ammoColor = "#4DA6FF"; // Lighter, more visible blue
    ctx.fillStyle = ammoColor;
    ctx.fillRect(-this.size, ammoBarY, barWidth * ammoPercentage, barHeight);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // Draw enemy glow
    const glowSize = this.size * (1.2 + this.glowIntensity * 0.3);
    const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
    glowGradient.addColorStop(
      0,
      `rgba(255, 0, 0, ${0.1 + this.glowIntensity * 0.2})`
    );
    glowGradient.addColorStop(
      0.5,
      `rgba(255, 0, 0, ${0.05 + this.glowIntensity * 0.1})`
    );
    glowGradient.addColorStop(1, "rgba(255, 0, 0, 0)");
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
    ctx.fill();

    // Draw enemy body based on type
    switch (this.type) {
      case "scout":
        this.drawScout(ctx);
        break;
      case "fighter":
        this.drawFighter(ctx);
        break;
      case "destroyer":
        this.drawDestroyer(ctx);
        break;
    }

    // Draw health and ammo bars
    this.drawHealthBar(ctx);
    this.drawAmmoBar(ctx);

    ctx.restore();
  }

  private drawScout(ctx: CanvasRenderingContext2D): void {
    // Scout body - small, fast, triangular
    ctx.beginPath();
    ctx.moveTo(this.size * 1.2, 0);
    ctx.lineTo(-this.size * 0.8, this.size * 0.6);
    ctx.lineTo(-this.size * 0.8, -this.size * 0.6);
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();

    // Scout details
    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Scout eyes
    ctx.fillStyle = this.eyeColor;
    ctx.beginPath();
    ctx.arc(
      this.size * 0.3,
      -this.size * 0.2,
      this.size * 0.15,
      0,
      Math.PI * 2
    );
    ctx.arc(this.size * 0.3, this.size * 0.2, this.size * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Scout mouth - scary grin
    ctx.beginPath();
    ctx.arc(-this.size * 0.2, 0, this.size * 0.3, 0, Math.PI, false);
    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private drawFighter(ctx: CanvasRenderingContext2D): void {
    // Fighter body - medium, hexagonal
    ctx.beginPath();
    ctx.moveTo(this.size * 1.2, 0);
    ctx.lineTo(this.size * 0.6, this.size * 0.8);
    ctx.lineTo(-this.size * 0.6, this.size * 0.8);
    ctx.lineTo(-this.size * 1.2, 0);
    ctx.lineTo(-this.size * 0.6, -this.size * 0.8);
    ctx.lineTo(this.size * 0.6, -this.size * 0.8);
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();

    // Fighter details
    ctx.strokeStyle = "#FF00FF";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Fighter eyes
    ctx.fillStyle = this.eyeColor;
    ctx.beginPath();
    ctx.arc(this.size * 0.4, -this.size * 0.3, this.size * 0.2, 0, Math.PI * 2);
    ctx.arc(this.size * 0.4, this.size * 0.3, this.size * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Fighter mouth - menacing
    ctx.beginPath();
    ctx.moveTo(-this.size * 0.4, -this.size * 0.2);
    ctx.lineTo(-this.size * 0.8, 0);
    ctx.lineTo(-this.size * 0.4, this.size * 0.2);
    ctx.strokeStyle = "#FF00FF";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  private drawDestroyer(ctx: CanvasRenderingContext2D): void {
    // Destroyer body - large, intimidating
    ctx.beginPath();
    ctx.moveTo(this.size * 1.5, 0);
    ctx.lineTo(this.size * 0.5, this.size);
    ctx.lineTo(-this.size * 0.5, this.size);
    ctx.lineTo(-this.size * 1.5, 0);
    ctx.lineTo(-this.size * 0.5, -this.size);
    ctx.lineTo(this.size * 0.5, -this.size);
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();

    // Destroyer details
    ctx.strokeStyle = "#00FFFF";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Destroyer eyes - multiple, menacing
    ctx.fillStyle = this.eyeColor;
    ctx.beginPath();
    ctx.arc(
      this.size * 0.5,
      -this.size * 0.4,
      this.size * 0.25,
      0,
      Math.PI * 2
    );
    ctx.arc(this.size * 0.5, this.size * 0.4, this.size * 0.25, 0, Math.PI * 2);
    ctx.arc(this.size * 0.2, 0, this.size * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Destroyer mouth - terrifying
    ctx.beginPath();
    ctx.moveTo(-this.size * 0.6, -this.size * 0.3);
    ctx.lineTo(-this.size * 1.2, 0);
    ctx.lineTo(-this.size * 0.6, this.size * 0.3);
    ctx.strokeStyle = "#00FFFF";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Destroyer spikes
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
      const spikeX = Math.cos(angle) * this.size * 1.2;
      const spikeY = Math.sin(angle) * this.size * 1.2;

      ctx.beginPath();
      ctx.moveTo(spikeX * 0.5, spikeY * 0.5);
      ctx.lineTo(spikeX, spikeY);
      ctx.strokeStyle = "#00FFFF";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  shoot(frameCount: number, targetX: number, targetY: number): Rocket | null {
    if (frameCount - this.lastShotTime >= this.shootCooldown && this.ammo > 0) {
      this.lastShotTime = frameCount;
      this.ammo--;

      // Calculate rocket spawn position - increased distance to prevent immediate collision
      const spawnDistance = this.size * 2.5; // Increased from 1.2 to 2.5
      const spawnX = this.x + Math.cos(this.rotation) * spawnDistance;
      const spawnY = this.y + Math.sin(this.rotation) * spawnDistance;

      return new Rocket(
        spawnX,
        spawnY,
        targetX,
        targetY,
        2,
        this.devicePixelRatio
      );
    }

    return null;
  }

  takeDamage(amount: number): boolean {
    this.health -= amount;
    if (this.health <= 0) {
      this.active = false;
      return true; // Enemy destroyed
    }
    return false; // Enemy still alive
  }

  checkCollision(x: number, y: number, radius: number): boolean {
    const dx = this.x - x;
    const dy = this.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < this.size + radius;
  }
}
