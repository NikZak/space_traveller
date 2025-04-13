export class Explosion {
  x: number;
  y: number;
  size: number;
  maxSize: number;
  growthRate: number;
  alpha: number;
  fadeRate: number;
  color: string;
  active: boolean;
  devicePixelRatio: number;

  constructor(x: number, y: number, size: number, devicePixelRatio = 1) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.maxSize = size * 3;
    this.growthRate = 2;
    this.alpha = 1;
    this.fadeRate = 0.05;
    this.color = "#FF4500";
    this.active = true;
    this.devicePixelRatio = devicePixelRatio;
  }

  update(): boolean {
    if (!this.active) return false;

    // Grow the explosion
    this.size += this.growthRate;
    this.alpha -= this.fadeRate;

    // Deactivate when fully faded or reached max size
    if (this.alpha <= 0 || this.size >= this.maxSize) {
      this.active = false;
      return false;
    }

    return true;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    ctx.save();

    // Draw explosion glow
    const gradient = ctx.createRadialGradient(
      this.x,
      this.y,
      0,
      this.x,
      this.y,
      this.size
    );
    gradient.addColorStop(0, `rgba(255, 69, 0, ${this.alpha})`);
    gradient.addColorStop(0.5, `rgba(255, 140, 0, ${this.alpha * 0.7})`);
    gradient.addColorStop(1, `rgba(255, 69, 0, 0)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();

    // Draw explosion particles
    const particleCount = 12;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const distance = this.size * 0.8;
      const particleX = this.x + Math.cos(angle) * distance;
      const particleY = this.y + Math.sin(angle) * distance;

      ctx.beginPath();
      ctx.arc(particleX, particleY, this.size * 0.1, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha * 0.8})`;
      ctx.fill();
    }

    ctx.restore();
  }
}
