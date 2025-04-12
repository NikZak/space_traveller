export class Rocket {
  x: number;
  y: number;
  velocity: { x: number; y: number };
  rotation: number;
  speed: number;
  size: number;
  active: boolean;
  trail: { x: number; y: number; alpha: number }[];
  maxTrailLength: number;
  timestamp: number;

  constructor(
    x: number,
    y: number,
    targetX: number,
    targetY: number,
    speed: number = 2
  ) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.size = 5;
    this.active = true;
    this.trail = [];
    this.maxTrailLength = 8;
    this.timestamp = Date.now();

    // Calculate direction to target
    const dx = targetX - x;
    const dy = targetY - y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Normalize and set velocity
    this.velocity = {
      x: (dx / distance) * this.speed,
      y: (dy / distance) * this.speed,
    };

    // Set rotation to face target
    this.rotation = Math.atan2(dy, dx);
  }

  update(canvas: HTMLCanvasElement): boolean {
    if (!this.active) return false;

    // Update position
    this.x += this.velocity.x;
    this.y += this.velocity.y;

    // Add to trail
    this.trail.push({ x: this.x, y: this.y, alpha: 1.0 });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }

    // Fade trail
    this.trail.forEach((point) => {
      point.alpha *= 0.9;
    });

    // Remove fully faded trail points
    this.trail = this.trail.filter((point) => point.alpha > 0.05);

    // Check if out of bounds - use the CSS dimensions (visible area) instead of canvas dimensions
    const visibleWidth = canvas.width / (window.devicePixelRatio || 1);
    const visibleHeight = canvas.height / (window.devicePixelRatio || 1);

    if (
      this.x < -this.size ||
      this.x > visibleWidth + this.size ||
      this.y < -this.size ||
      this.y > visibleHeight + this.size
    ) {
      this.active = false;
      return false;
    }

    return true;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Draw trail
    this.trail.forEach((point, index) => {
      const radius = this.size * (index / this.trail.length);
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 100, 0, ${point.alpha})`;
      ctx.fill();
    });

    // Draw rocket
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // Rocket body
    ctx.beginPath();
    ctx.moveTo(this.size * 1.5, 0);
    ctx.lineTo(-this.size * 0.5, this.size * 0.5);
    ctx.lineTo(-this.size * 0.5, -this.size * 0.5);
    ctx.closePath();
    ctx.fillStyle = "#ff4400";
    ctx.fill();

    // Rocket fins
    ctx.fillStyle = "#cc3300";
    ctx.fillRect(
      -this.size * 0.5,
      -this.size * 0.5,
      this.size * 0.3,
      this.size
    );
    ctx.fillRect(
      -this.size * 0.5,
      this.size * 0.5,
      this.size * 0.3,
      -this.size
    );

    // Rocket engine glow
    const gradient = ctx.createRadialGradient(
      -this.size * 0.8,
      0,
      0,
      -this.size * 0.8,
      0,
      this.size * 1.5
    );
    gradient.addColorStop(0, "rgba(255, 255, 0, 0.8)");
    gradient.addColorStop(0.5, "rgba(255, 100, 0, 0.5)");
    gradient.addColorStop(1, "rgba(255, 0, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(-this.size * 0.8, 0, this.size * 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  checkCollision(x: number, y: number, radius: number): boolean {
    const dx = this.x - x;
    const dy = this.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < this.size + radius;
  }
}
