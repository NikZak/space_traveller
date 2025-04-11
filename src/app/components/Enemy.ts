import { Rocket } from "./Rocket";

export class Enemy {
  x: number;
  y: number;
  velocity: { x: number; y: number };
  rotation: number;
  size: number;
  active: boolean;
  health: number;
  maxHealth: number;
  shootCooldown: number;
  lastShotTime: number;
  type: "scout" | "fighter" | "destroyer";
  color: string;
  eyeColor: string;
  glowIntensity: number;
  glowDirection: number;
  pulseSpeed: number;

  constructor(
    x: number,
    y: number,
    type: "scout" | "fighter" | "destroyer" = "scout"
  ) {
    this.x = x;
    this.y = y;
    this.active = true;
    this.type = type;
    this.pulseSpeed = 0.05 + Math.random() * 0.05;
    this.glowIntensity = 0.5;
    this.glowDirection = 1;

    // Set properties based on enemy type
    switch (type) {
      case "scout":
        this.size = 12;
        this.health = 30;
        this.maxHealth = 30;
        this.shootCooldown = 240;
        this.color = "#8B0000"; // Dark red
        this.eyeColor = "#FF0000"; // Bright red
        break;
      case "fighter":
        this.size = 18;
        this.health = 60;
        this.maxHealth = 60;
        this.shootCooldown = 180;
        this.color = "#800080"; // Purple
        this.eyeColor = "#FF00FF"; // Magenta
        break;
      case "destroyer":
        this.size = 25;
        this.health = 100;
        this.maxHealth = 100;
        this.shootCooldown = 120;
        this.color = "#000080"; // Navy blue
        this.eyeColor = "#00FFFF"; // Cyan
        break;
    }

    this.lastShotTime = 0;
    this.rotation = Math.random() * Math.PI * 2;

    // Random initial velocity
    const speed = 1 + Math.random() * 2;
    const angle = Math.random() * Math.PI * 2;
    this.velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    };
  }

  update(canvas: HTMLCanvasElement, playerX: number, playerY: number): void {
    if (!this.active) return;

    // Update position
    this.x += this.velocity.x;
    this.y += this.velocity.y;

    // Update glow effect
    this.glowIntensity += this.glowDirection * this.pulseSpeed;
    if (this.glowIntensity > 0.8 || this.glowIntensity < 0.2) {
      this.glowDirection *= -1;
    }

    // Wrap around screen - use the CSS dimensions (visible area) instead of canvas dimensions
    const visibleWidth = canvas.width / (window.devicePixelRatio || 1);
    const visibleHeight = canvas.height / (window.devicePixelRatio || 1);

    if (this.x < -this.size) this.x = visibleWidth + this.size;
    if (this.x > visibleWidth + this.size) this.x = -this.size;
    if (this.y < -this.size) this.y = visibleHeight + this.size;
    if (this.y > visibleHeight + this.size) this.y = -this.size;

    // Rotate to face player
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    this.rotation = Math.atan2(dy, dx);
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

    // Draw health bar
    this.drawHealthBar(ctx);

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

  shoot(frameCount: number, targetX: number, targetY: number): Rocket | null {
    if (frameCount - this.lastShotTime >= this.shootCooldown) {
      this.lastShotTime = frameCount;

      // Calculate rocket spawn position
      const spawnDistance = this.size * 1.2;
      const spawnX = this.x + Math.cos(this.rotation) * spawnDistance;
      const spawnY = this.y + Math.sin(this.rotation) * spawnDistance;

      return new Rocket(spawnX, spawnY, targetX, targetY);
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
