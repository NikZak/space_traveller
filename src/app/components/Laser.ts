export class Laser {
  x: number;
  y: number;
  velocity: { x: number; y: number };
  rotation: number;
  life: number;
  maxLife: number;
  size: number;
  devicePixelRatio: number;

  constructor(
    x: number,
    y: number,
    rotation: number,
    speed: number,
    devicePixelRatio = 1
  ) {
    this.x = x;
    this.y = y;
    this.rotation = rotation;
    this.velocity = {
      x: Math.cos(rotation) * speed,
      y: Math.sin(rotation) * speed,
    };
    this.life = 0;
    this.maxLife = 60; // Frames the laser will live for
    this.size = 10; // Base size for the laser
    this.devicePixelRatio = devicePixelRatio;
  }

  update(canvas: HTMLCanvasElement): boolean {
    // Update position
    this.x += this.velocity.x;
    this.y += this.velocity.y;

    // Check if out of bounds - use the CSS dimensions (visible area) instead of canvas dimensions
    const visibleWidth = canvas.width / this.devicePixelRatio;
    const visibleHeight = canvas.height / this.devicePixelRatio;

    if (
      this.x < -this.size ||
      this.x > visibleWidth + this.size ||
      this.y < -this.size ||
      this.y > visibleHeight + this.size
    ) {
      return false;
    }

    this.life++;
    return this.life < this.maxLife;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // Draw laser beam
    const gradient = ctx.createLinearGradient(-this.size, 0, this.size, 0);
    gradient.addColorStop(0, "rgba(255, 0, 0, 0)");
    gradient.addColorStop(0.2, "rgba(255, 0, 0, 0.8)");
    gradient.addColorStop(0.5, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.8, "rgba(255, 0, 0, 0.8)");
    gradient.addColorStop(1, "rgba(255, 0, 0, 0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(-this.size, -this.size * 0.2, this.size * 2, this.size * 0.4);

    // Add glow effect
    ctx.shadowBlur = this.size;
    ctx.shadowColor = "rgba(255, 0, 0, 0.8)";
    ctx.fillRect(-this.size, -this.size * 0.2, this.size * 2, this.size * 0.4);

    ctx.restore();
  }
}
